"use strict";

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const ROOT = path.join(__dirname, "..", "..");
const BACKLOG_PATH = path.join(ROOT, "backlog.json");
const TASKS_DIR = path.join(ROOT, "tasks");

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

// Keep the "- **상태**: X" line in tasks/<id>.md in sync with the real
// status in backlog.json. Without this, the CLI is the source of truth
// but the doc silently drifts and shows stale/wrong status forever.
function syncDetailDocStatus(t) {
  const docPath = path.join(ROOT, t.detail_doc);
  if (!fs.existsSync(docPath)) return;
  const content = fs.readFileSync(docPath, "utf8");
  const updated = content.replace(/^- \*\*상태\*\*:.*$/m, `- **상태**: ${t.status}`);
  if (updated !== content) fs.writeFileSync(docPath, updated, "utf8");
}

module.exports = {
  fs,
  path,
  readline,
  ROOT,
  BACKLOG_PATH,
  TASKS_DIR,
  loadBacklog,
  saveBacklog,
  nowIso,
  parseArgs,
  toList,
  flag,
  findTask,
  nextId,
  nextOrder,
  ask,
  pad,
  printTable,
  printTask,
  validateStatus,
  validateDepsExist,
  syncDetailDocStatus,
};
