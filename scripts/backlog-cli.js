#!/usr/bin/env node
"use strict";

/**
 * backlog.json 조회/수정/추가용 CLI.
 * 의존성 없이 node만으로 실행: `node scripts/backlog-cli.js <command> [flags]`
 * `node scripts/backlog-cli.js --help` 로 전체 명령어 확인.
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const ROOT = path.join(__dirname, "..");
const BACKLOG_PATH = path.join(ROOT, "backlog.json");
const TASKS_DIR = path.join(ROOT, "tasks");

// ---------- 기본 유틸 ----------

function loadBacklog() {
  if (!fs.existsSync(BACKLOG_PATH)) {
    console.error(`backlog.json을 찾을 수 없습니다: ${BACKLOG_PATH}`);
    process.exit(1);
  }
  const raw = fs.readFileSync(BACKLOG_PATH, "utf8");
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error(`backlog.json 파싱 실패: ${e.message}`);
    process.exit(1);
  }
}

function saveBacklog(backlog) {
  fs.writeFileSync(BACKLOG_PATH, JSON.stringify(backlog, null, 2) + "\n", "utf8");
}

function nowIso() {
  return new Date().toISOString();
}

function parseArgs(argv) {
  const result = { _: [], flags: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      let key = a.slice(2);
      let val;
      if (key.includes("=")) {
        const idx = key.indexOf("=");
        val = key.slice(idx + 1);
        key = key.slice(0, idx);
      } else if (argv[i + 1] !== undefined && !argv[i + 1].startsWith("--")) {
        val = argv[++i];
      } else {
        val = true;
      }
      if (result.flags[key] !== undefined) {
        const prev = result.flags[key];
        result.flags[key] = Array.isArray(prev) ? [...prev, val] : [prev, val];
      } else {
        result.flags[key] = val;
      }
    } else {
      result._.push(a);
    }
  }
  return result;
}

// flag 값을 배열로 정규화 (쉼표 구분 지원, 다중 --flag 지원)
function toList(val) {
  if (val === undefined) return [];
  const arr = Array.isArray(val) ? val : [val];
  return arr
    .flatMap((v) => String(v).split(","))
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

function flag(flags, key, def) {
  return flags[key] === undefined ? def : flags[key];
}

function findTask(backlog, id) {
  return backlog.tasks.find((t) => t.id === id);
}

function nextId(backlog) {
  let max = 0;
  for (const t of backlog.tasks) {
    const m = /^T(\d+)$/.exec(t.id);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  const n = max + 1;
  return `T${String(n).padStart(3, "0")}`;
}

function nextOrder(backlog) {
  return backlog.tasks.reduce((m, t) => Math.max(m, t.order || 0), 0) + 1;
}

function ask(rl, question, def) {
  const suffix = def ? ` [${def}]` : "";
  return new Promise((resolve) => {
    rl.question(`${question}${suffix}: `, (answer) => {
      resolve(answer.trim() || def || "");
    });
  });
}

// ---------- 출력 헬퍼 ----------

function pad(str, len) {
  str = String(str ?? "");
  if (str.length > len) return str.slice(0, len - 1) + "…";
  return str.padEnd(len);
}

function printTable(tasks) {
  const header = `${pad("ID", 6)} ${pad("STATUS", 15)} ${pad("PRI", 6)} ${pad("PHASE", 14)} ${pad("ASSIGNEE", 10)} TITLE`;
  console.log(header);
  console.log("-".repeat(header.length + 20));
  for (const t of tasks) {
    console.log(
      `${pad(t.id, 6)} ${pad(t.status, 15)} ${pad(t.priority, 6)} ${pad(t.phase, 14)} ${pad(t.assignee ?? "-", 10)} ${t.title}`
    );
  }
  console.log(`\n총 ${tasks.length}건`);
}

function printTask(backlog, t) {
  console.log(`# ${t.id} — ${t.title}`);
  console.log(`  status       : ${t.status} (${backlog.statuses[t.status] ?? "?"})`);
  console.log(`  phase        : ${t.phase} (${backlog.phases?.[t.phase] ?? "?"})`);
  console.log(`  priority     : ${t.priority}`);
  console.log(`  assignee     : ${t.assignee ?? "-"}`);
  console.log(`  estimated    : ${t.estimated_minutes}분`);
  console.log(`  dependencies : ${t.dependencies.length ? t.dependencies.join(", ") : "-"}`);
  console.log(`  tags         : ${t.tags.length ? t.tags.join(", ") : "-"}`);
  console.log(`  blocked_reason: ${t.blocked_reason ?? "-"}`);
  console.log(`  created_at   : ${t.created_at}`);
  console.log(`  updated_at   : ${t.updated_at}`);
  console.log(`  detail_doc   : ${t.detail_doc}`);
  console.log(`\n  ${t.description}`);
}

// ---------- 명령어 구현 ----------

function cmdList(backlog, flags) {
  let tasks = backlog.tasks.slice();
  if (flags.status) tasks = tasks.filter((t) => toList(flags.status).includes(t.status));
  if (flags.phase) tasks = tasks.filter((t) => toList(flags.phase).includes(t.phase));
  if (flags.priority) tasks = tasks.filter((t) => toList(flags.priority).includes(t.priority));
  if (flags.assignee) {
    const wanted = toList(flags.assignee).map((v) => (v === "none" ? null : v));
    tasks = tasks.filter((t) => wanted.includes(t.assignee));
  }
  if (flags.tag) {
    const wanted = toList(flags.tag);
    tasks = tasks.filter((t) => wanted.some((w) => t.tags.includes(w)));
  }
  if (flags.id) {
    const prefix = String(flags.id);
    tasks = tasks.filter((t) => t.id.startsWith(prefix));
  }
  tasks.sort((a, b) => a.order - b.order);

  if (flags.json) {
    console.log(JSON.stringify(tasks, null, 2));
    return;
  }
  printTable(tasks);
}

function cmdShow(backlog, args, flags) {
  const id = args._[0];
  if (!id) {
    console.error("사용법: backlog-cli show <id>");
    process.exit(1);
  }
  const t = findTask(backlog, id);
  if (!t) {
    console.error(`task를 찾을 수 없습니다: ${id}`);
    process.exit(1);
  }
  if (flags.json) {
    console.log(JSON.stringify(t, null, 2));
    return;
  }
  printTask(backlog, t);

  if (!flags["no-doc"]) {
    const docPath = path.join(ROOT, t.detail_doc);
    if (fs.existsSync(docPath)) {
      console.log(`\n---- ${t.detail_doc} ----\n`);
      console.log(fs.readFileSync(docPath, "utf8"));
    } else {
      console.log(`\n(상세 문서 없음: ${t.detail_doc})`);
    }
  }
}

function validateStatus(backlog, status) {
  if (!Object.keys(backlog.statuses).includes(status)) {
    console.error(
      `잘못된 status: "${status}". 사용 가능: ${Object.keys(backlog.statuses).join(", ")}`
    );
    process.exit(1);
  }
}

function validateDepsExist(backlog, ids, selfId) {
  for (const id of ids) {
    if (id === selfId) {
      console.error(`task는 자기 자신을 dependency로 가질 수 없습니다: ${id}`);
      process.exit(1);
    }
    if (!findTask(backlog, id)) {
      console.error(`존재하지 않는 dependency id: ${id}`);
      process.exit(1);
    }
  }
}

function detailDocTemplate(t) {
  const depsList = t.dependencies.length ? t.dependencies.map((d) => `- ${d}`).join("\n") : "- (없음)";
  return `# ${t.id} — ${t.title}

- **단계(phase)**: ${t.phase}
- **상태**: ${t.status}
- **예상 소요**: ${t.estimated_minutes}분
- **선행 작업(dependencies)**:
${depsList}

## 설명

${t.description}

## 목표

(TBD)

## 관련 요구사항 (개발요구사항문서.md)

> (TBD)

## 완료 조건 (Acceptance Criteria)

- [ ] (TBD)

## 메모

(작업 중 특이사항, 결정 사항, 사람 판단이 필요한 이유 등을 이곳에 기록)
`;
}

async function cmdAdd(backlog, flags) {
  let title = flag(flags, "title");
  let description = flag(flags, "description", "");
  let phase = flag(flags, "phase", "misc");
  let priority = flag(flags, "priority", "medium");
  let assignee = flag(flags, "assignee", null);
  let estimate = parseInt(flag(flags, "estimate", "30"), 10);
  let deps = toList(flags.dep);
  let tags = toList(flags.tag);

  if (!title) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    title = await ask(rl, "제목(title)");
    description = await ask(rl, "설명(description)", description);
    phase = await ask(rl, "단계(phase)", phase);
    priority = await ask(rl, "우선순위(high/medium/low)", priority);
    const depsAnswer = await ask(rl, "선행 작업 id (쉼표로 구분, 없으면 엔터)", "");
    deps = toList(depsAnswer);
    const tagsAnswer = await ask(rl, "태그 (쉼표로 구분, 없으면 엔터)", phase);
    tags = toList(tagsAnswer);
    rl.close();
  }

  if (!title) {
    console.error("title은 필수입니다.");
    process.exit(1);
  }
  if (!Number.isFinite(estimate) || estimate <= 0) estimate = 30;
  if (!["high", "medium", "low"].includes(priority)) {
    console.error('priority는 high/medium/low 중 하나여야 합니다.');
    process.exit(1);
  }
  validateDepsExist(backlog, deps, null);
  if (tags.length === 0) tags = [phase];

  const id = nextId(backlog);
  const task = {
    id,
    title,
    description,
    detail_doc: `tasks/${id}.md`,
    status: "todo",
    phase,
    order: nextOrder(backlog),
    estimated_minutes: estimate,
    priority,
    assignee: assignee || null,
    dependencies: deps,
    tags,
    blocked_reason: null,
    created_at: nowIso(),
    updated_at: nowIso(),
  };

  backlog.tasks.push(task);
  saveBacklog(backlog);

  fs.mkdirSync(TASKS_DIR, { recursive: true });
  fs.writeFileSync(path.join(TASKS_DIR, `${id}.md`), detailDocTemplate(task), "utf8");

  console.log(`추가됨: ${id} — ${title}`);
  console.log(`상세 문서: tasks/${id}.md (내용을 채워주세요)`);
}

function cmdUpdate(backlog, args, flags) {
  const id = args._[0];
  if (!id) {
    console.error("사용법: backlog-cli update <id> [--status ...] [--title ...] ...");
    process.exit(1);
  }
  const t = findTask(backlog, id);
  if (!t) {
    console.error(`task를 찾을 수 없습니다: ${id}`);
    process.exit(1);
  }

  let changed = false;

  if (flags.status !== undefined) {
    validateStatus(backlog, flags.status);
    t.status = flags.status;
    changed = true;
  }
  if (flags.title !== undefined) {
    t.title = String(flags.title);
    changed = true;
  }
  if (flags.description !== undefined) {
    t.description = String(flags.description);
    changed = true;
  }
  if (flags.phase !== undefined) {
    t.phase = String(flags.phase);
    changed = true;
  }
  if (flags.priority !== undefined) {
    if (!["high", "medium", "low"].includes(flags.priority)) {
      console.error('priority는 high/medium/low 중 하나여야 합니다.');
      process.exit(1);
    }
    t.priority = flags.priority;
    changed = true;
  }
  if (flags.assignee !== undefined) {
    const v = String(flags.assignee);
    t.assignee = v === "" || v.toLowerCase() === "none" ? null : v;
    changed = true;
  }
  if (flags.estimate !== undefined) {
    const n = parseInt(flags.estimate, 10);
    if (Number.isFinite(n) && n > 0) {
      t.estimated_minutes = n;
      changed = true;
    }
  }
  if (flags["blocked-reason"] !== undefined) {
    const v = String(flags["blocked-reason"]);
    t.blocked_reason = v === "" || v.toLowerCase() === "none" ? null : v;
    changed = true;
  }
  if (flags.dep !== undefined) {
    const newDeps = toList(flags.dep);
    validateDepsExist(backlog, newDeps, t.id);
    t.dependencies = newDeps;
    changed = true;
  }
  if (flags["add-dep"] !== undefined) {
    const add = toList(flags["add-dep"]);
    validateDepsExist(backlog, add, t.id);
    t.dependencies = Array.from(new Set([...t.dependencies, ...add]));
    changed = true;
  }
  if (flags["remove-dep"] !== undefined) {
    const remove = new Set(toList(flags["remove-dep"]));
    t.dependencies = t.dependencies.filter((d) => !remove.has(d));
    changed = true;
  }
  if (flags.tag !== undefined) {
    t.tags = toList(flags.tag);
    changed = true;
  }
  if (flags["add-tag"] !== undefined) {
    t.tags = Array.from(new Set([...t.tags, ...toList(flags["add-tag"])]));
    changed = true;
  }
  if (flags["remove-tag"] !== undefined) {
    const remove = new Set(toList(flags["remove-tag"]));
    t.tags = t.tags.filter((tag) => !remove.has(tag));
    changed = true;
  }

  if (!changed) {
    console.error("변경할 필드를 최소 하나 이상 지정해야 합니다. (--status, --title, --priority, --assignee, --dep, --tag ...)");
    process.exit(1);
  }

  t.updated_at = nowIso();
  saveBacklog(backlog);
  console.log(`수정됨: ${t.id}`);
  printTask(backlog, t);
}

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

  // 순환 의존성 검사
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

function printHelp() {
  console.log(`backlog-cli — backlog.json 조회/수정/추가 도구

사용법: node scripts/backlog-cli.js <command> [flags]

명령어:
  list [--status s] [--phase p] [--priority p] [--assignee name|none]
       [--tag t] [--id prefix] [--json]
       조건에 맞는 task 목록을 표로 출력합니다.

  show <id> [--json] [--no-doc]
       task 상세 정보와 연결된 상세 문서(tasks/<id>.md) 내용을 출력합니다.

  add [--title t] [--description d] [--phase p] [--priority high|medium|low]
      [--assignee name] [--estimate minutes] [--dep id ...] [--tag t ...]
      새 task를 추가합니다. --title 없이 실행하면 대화형으로 입력받습니다.
      id는 자동 생성되며(T031, T032 ...), tasks/<id>.md 템플릿도 함께 생성합니다.

  update <id> [--status s] [--title t] [--description d] [--phase p]
      [--priority high|medium|low] [--assignee name|none] [--estimate minutes]
      [--blocked-reason text|none]
      [--dep id,...] [--add-dep id] [--remove-dep id]
      [--tag t,...] [--add-tag t] [--remove-tag t]
      지정한 필드만 수정합니다. (alias: edit)

  next [--n N] [--all] [--json]
       상태가 todo이고 선행 작업(dependencies)이 모두 done인 task 중
       순서(order)가 가장 빠른 것을 보여줍니다. (다음에 할 일 추천)

  stats
       상태별/단계별 건수와 총 예상 소요 시간을 요약합니다.

  validate
       id 중복, 존재하지 않는 dependency, 순환 의존성, 상세 문서 누락 등을 검사합니다.

상태값: ${"todo, in_progress, needs_review, needs_decision, waiting, done, cancelled"}
`);
}

// ---------- entry ----------

async function main() {
  const argv = process.argv.slice(2);
  const command = argv[0];
  const rest = parseArgs(argv.slice(1));

  if (!command || command === "--help" || command === "-h" || command === "help") {
    printHelp();
    return;
  }

  const backlog = loadBacklog();

  switch (command) {
    case "list":
    case "ls":
      cmdList(backlog, rest.flags);
      break;
    case "show":
      cmdShow(backlog, rest, rest.flags);
      break;
    case "add":
      await cmdAdd(backlog, rest.flags);
      break;
    case "update":
    case "edit":
      cmdUpdate(backlog, rest, rest.flags);
      break;
    case "next":
      cmdNext(backlog, rest.flags);
      break;
    case "stats":
      cmdStats(backlog);
      break;
    case "validate":
      cmdValidate(backlog);
      break;
    default:
      console.error(`알 수 없는 명령어: ${command}\n`);
      printHelp();
      process.exit(1);
  }
}

main();
