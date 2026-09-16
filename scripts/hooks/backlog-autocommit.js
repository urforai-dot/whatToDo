#!/usr/bin/env node
"use strict";

// PostToolUse hook for the Bash tool.
// If backlog.json changed since HEAD:
//   - if any task's status newly became "done": stage everything, commit a
//     work summary, and push.
//   - otherwise: commit just backlog.json (chore commit), no push.

const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..", "..");

function git(args) {
  return spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
}

function hasBacklogChange() {
  const res = git(["status", "--porcelain", "--", "backlog.json"]);
  return res.status === 0 && res.stdout.trim().length > 0;
}

function readOldBacklog() {
  const res = git(["show", "HEAD:backlog.json"]);
  if (res.status !== 0) return { tasks: [] };
  try {
    return JSON.parse(res.stdout);
  } catch {
    return { tasks: [] };
  }
}

function readNewBacklog() {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, "backlog.json"), "utf8"));
  } catch {
    return { tasks: [] };
  }
}

function statusMap(backlog) {
  const m = new Map();
  for (const t of backlog.tasks || []) m.set(t.id, t.status);
  return m;
}

function commitWithMessage(message) {
  const tmpFile = path.join(os.tmpdir(), `backlog-commit-${Date.now()}.txt`);
  fs.writeFileSync(tmpFile, message, "utf8");
  const res = git(["commit", "-F", tmpFile]);
  fs.unlinkSync(tmpFile);
  return res;
}

function main() {
  if (!hasBacklogChange()) return;

  const oldBacklog = readOldBacklog();
  const newBacklog = readNewBacklog();
  const oldStatus = statusMap(oldBacklog);

  const newlyDone = (newBacklog.tasks || []).filter(
    (t) => t.status === "done" && oldStatus.get(t.id) !== "done"
  );

  if (newlyDone.length > 0) {
    const lines = newlyDone.map((t) => `- ${t.id}: ${t.title}`);
    const summaryTitle =
      newlyDone.length === 1
        ? `Complete ${newlyDone[0].id}: ${newlyDone[0].title}`
        : `Complete ${newlyDone.length} tasks: ${newlyDone.map((t) => t.id).join(", ")}`;
    const message = `${summaryTitle}\n\n${lines.join("\n")}\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`;

    git(["add", "-A"]);
    const commitRes = commitWithMessage(message);
    if (commitRes.status !== 0) {
      console.log(
        JSON.stringify({
          systemMessage: `⚠️ backlog 완료 커밋 실패: ${(commitRes.stderr || commitRes.stdout || "").slice(0, 500)}`,
        })
      );
      return;
    }
    const pushRes = git(["push"]);
    if (pushRes.status !== 0) {
      console.log(
        JSON.stringify({
          systemMessage: `✅ 커밋 완료(${newlyDone.map((t) => t.id).join(", ")}), 하지만 push 실패: ${(pushRes.stderr || "").slice(0, 500)}`,
        })
      );
      return;
    }
    console.log(
      JSON.stringify({
        systemMessage: `✅ 완료 처리된 작업 커밋+푸시됨: ${newlyDone.map((t) => t.id).join(", ")}`,
      })
    );
    return;
  }

  git(["add", "backlog.json"]);
  const commitRes = commitWithMessage(
    "chore(backlog): update backlog.json\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
  );
  if (commitRes.status === 0) {
    console.log(JSON.stringify({ systemMessage: "📝 backlog.json 변경사항 커밋됨" }));
  }
}

main();
