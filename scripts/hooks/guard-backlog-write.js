#!/usr/bin/env node
"use strict";

// PreToolUse hook for Write/Edit tools.
// Blocks direct edits of backlog.json and points to the CLI instead.

const path = require("path");

function readStdin() {
  try {
    return JSON.parse(require("fs").readFileSync(0, "utf8"));
  } catch {
    return {};
  }
}

const input = readStdin();
const filePath = input?.tool_input?.file_path;

if (filePath && path.basename(filePath) === "backlog.json") {
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason:
          "backlog.json은 직접 수정할 수 없습니다. `node scripts/backlog-cli.js add ...` 또는 `node scripts/backlog-cli.js update <id> ...` 로 수정/추가하세요.",
      },
    })
  );
}
