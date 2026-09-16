#!/usr/bin/env node
"use strict";

// PreToolUse hook for the Bash tool.
// Blocks commands that read/edit backlog.json directly (cat, Get-Content,
// sed, jq, node -e, ...). git commands and the backlog CLI are allowed.

function readStdin() {
  try {
    return JSON.parse(require("fs").readFileSync(0, "utf8"));
  } catch {
    return {};
  }
}

const input = readStdin();
const command = input?.tool_input?.command;

if (typeof command === "string" && command.includes("backlog.json")) {
  const isGit = /^\s*git\b/i.test(command);
  const isCli = command.includes("backlog-cli");

  if (!isGit && !isCli) {
    console.log(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason:
            "backlog.json은 셸 명령으로 직접 조회/수정할 수 없습니다. `node scripts/backlog-cli.js list|show|add|update` 를 사용하세요. (git 명령은 허용됩니다)",
        },
      })
    );
  }
}
