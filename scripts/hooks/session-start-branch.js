#!/usr/bin/env node
"use strict";

// SessionStart hook: announces the current git branch and nudges off main.

const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..", "..");

function main() {
  const res = spawnSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (res.status !== 0) return;

  const branch = res.stdout.trim();
  let message;
  if (branch === "main" || branch === "master") {
    message = `현재 브랜치: ${branch} ⚠️ main(master) 브랜치에서 세션이 시작되었습니다. 작업 전에 'git checkout -b dev' (dev가 없으면) 또는 'git checkout dev' 로 전환하는 것을 권장합니다.`;
  } else {
    message = `현재 브랜치: ${branch}`;
  }

  console.log(
    JSON.stringify({
      systemMessage: message,
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: message,
      },
    })
  );
}

main();
