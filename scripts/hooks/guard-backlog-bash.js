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
  // Split on shell command separators so each command in a chain (e.g.
  // `cd x && git commit -m "...backlog.json..."`) is judged on its own —
  // a segment just needs to itself be a git call or CLI call to be safe,
  // even if an earlier/later segment (or the commit message text) also
  // mentions backlog.json.
  const segments = command.split(/&&|\|\||[;|]/);
  const unsafe = segments.some((seg) => {
    if (!seg.includes("backlog.json")) return false;
    const isGit = /^\s*git\b/i.test(seg);
    const isCli = seg.includes("backlog-cli");
    return !isGit && !isCli;
  });

  if (unsafe) {
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
