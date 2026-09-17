"use strict";

const {
  fs,
  path,
  readline,
  ROOT,
  TASKS_DIR,
  saveBacklog,
  toList,
  flag,
  findTask,
  nextId,
  nextOrder,
  ask,
  printTable,
  printTask,
  validateStatus,
  validateDepsExist,
  syncDetailDocStatus,
} = require("./util");

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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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
  let statusChanged = false;

  if (flags.status !== undefined) {
    validateStatus(backlog, flags.status);
    t.status = flags.status;
    changed = true;
    statusChanged = true;
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

  t.updated_at = new Date().toISOString();
  saveBacklog(backlog);
  if (statusChanged) syncDetailDocStatus(t);
  console.log(`수정됨: ${t.id}`);
  printTask(backlog, t);
}

module.exports = { cmdList, cmdShow, cmdAdd, cmdUpdate, detailDocTemplate };
