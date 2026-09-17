"use strict";

const { fs, path, ROOT, flag, findTask, pad, printTable } = require("./util");

function cmdNext(backlog, flags) {
  const candidates = backlog.tasks
    .filter((t) => t.status === "todo")
    .filter((t) =>
      t.dependencies.every((d) => {
        const dep = findTask(backlog, d);
        return dep && dep.status === "done";
      })
    )
    .sort((a, b) => a.order - b.order);

  const n = flags.all ? candidates.length : parseInt(flag(flags, "n", "1"), 10);
  const result = candidates.slice(0, n);

  if (flags.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (result.length === 0) {
    console.log("바로 시작 가능한(todo이면서 선행 작업이 모두 완료된) task가 없습니다.");
    return;
  }
  printTable(result);
}

function cmdStats(backlog) {
  const byStatus = {};
  const byPhase = {};
  for (const t of backlog.tasks) {
    byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    byPhase[t.phase] = (byPhase[t.phase] || 0) + 1;
  }
  console.log("상태별:");
  for (const [status, label] of Object.entries(backlog.statuses)) {
    console.log(`  ${pad(status, 15)} ${label.padEnd(12)} ${byStatus[status] || 0}건`);
  }
  console.log("\n단계별:");
  for (const [phase, count] of Object.entries(byPhase)) {
    console.log(`  ${pad(phase, 15)} ${count}건`);
  }
  const totalMinutes = backlog.tasks
    .filter((t) => t.status !== "cancelled")
    .reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);
  console.log(`\n총 예상 소요(취소 제외): ${totalMinutes}분 (~${(totalMinutes / 60).toFixed(1)}시간)`);
}

function cmdValidate(backlog) {
  const errors = [];
  const ids = new Set();
  for (const t of backlog.tasks) {
    if (ids.has(t.id)) errors.push(`중복 id: ${t.id}`);
    ids.add(t.id);
    if (!Object.keys(backlog.statuses).includes(t.status)) {
      errors.push(`${t.id}: 잘못된 status "${t.status}"`);
    }
    for (const d of t.dependencies) {
      if (d === t.id) errors.push(`${t.id}: 자기 자신을 dependency로 가짐`);
      else if (!backlog.tasks.some((x) => x.id === d)) {
        errors.push(`${t.id}: 존재하지 않는 dependency "${d}"`);
      }
    }
    const docPath = path.join(ROOT, t.detail_doc);
    if (!fs.existsSync(docPath)) {
      errors.push(`${t.id}: 상세 문서 없음 (${t.detail_doc})`);
    }
  }

  const visiting = new Set();
  const visited = new Set();
  function dfs(id, chain) {
    if (visiting.has(id)) {
      errors.push(`순환 의존성: ${[...chain, id].join(" -> ")}`);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    const t = findTask(backlog, id);
    if (t) {
      for (const d of t.dependencies) dfs(d, [...chain, id]);
    }
    visiting.delete(id);
    visited.add(id);
  }
  for (const t of backlog.tasks) dfs(t.id, []);

  if (errors.length === 0) {
    console.log(`OK: task ${backlog.tasks.length}건, 문제 없음.`);
    return;
  }
  console.error(`문제 ${errors.length}건 발견:`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

module.exports = { cmdNext, cmdStats, cmdValidate };
