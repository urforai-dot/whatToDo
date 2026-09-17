#!/usr/bin/env node
"use strict";

// PostToolUse hook for Write/Edit tools.
// 1) Enforces a max-line budget per source file (warn at 85%, block at 100%+).
// 2) Runs `npm run lint` / `npm run build` (if defined) and blocks on failure.

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..", "..");
const CONFIG = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), "utf8"));

function readStdin() {
  try {
    return JSON.parse(fs.readFileSync(0, "utf8"));
  } catch {
    return {};
  }
}

function truncate(str, max) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "\n... (truncated)" : str;
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function runNpmScript(name) {
  return spawnSync("npm", ["run", name, "--if-present"], {
    cwd: ROOT,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
}

// This project lives under a OneDrive-synced folder, which occasionally
// holds a file handle open (EPERM/EBUSY on unlink/rename in .next) during
// `next build`. That's a transient OS/sync race, not a real build error —
// retry a couple of times before treating it as a genuine failure.
function runNpmScriptWithRetry(name, attempts) {
  let res = runNpmScript(name);
  for (let i = 1; i < attempts && res.status !== 0; i++) {
    const out = (res.stdout || "") + (res.stderr || "");
    if (!/EPERM|EBUSY/.test(out)) break;
    sleep(1500);
    res = runNpmScript(name);
  }
  return res;
}

function main() {
  const input = readStdin();
  const filePath = input?.tool_input?.file_path || input?.tool_response?.filePath;
  if (!filePath || !fs.existsSync(filePath)) return;

  const relPath = path.relative(ROOT, filePath);
  if (path.basename(filePath) === "backlog.json") return;

  const ext = path.extname(filePath).toLowerCase();
  const messages = [];
  const blockReasons = [];

  if (CONFIG.codeExtensions.includes(ext)) {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n").length;
    const pct = Math.round((lines / CONFIG.maxLines) * 100);

    if (pct >= 100) {
      blockReasons.push(
        `${relPath} 이(가) 최대 줄수를 초과했습니다 (${lines}/${CONFIG.maxLines}줄, ${pct}%). 파일을 분리하거나 리팩터링한 뒤 다시 작업하세요.`
      );
    } else if (pct >= CONFIG.warnThresholdPct) {
      messages.push(
        `⚠️ ${relPath} 이(가) 최대 줄수의 ${pct}%를 사용했습니다 (${lines}/${CONFIG.maxLines}줄). 계속 늘어나면 분리를 고려하세요.`
      );
    }
  }

  if (CONFIG.lintBuildExtensions.includes(ext)) {
    const pkgPath = path.join(ROOT, "package.json");
    if (fs.existsSync(pkgPath)) {
      const lintRes = runNpmScript("lint");
      if (lintRes.status !== 0) {
        blockReasons.push(
          `lint 실패:\n${truncate(lintRes.stdout + lintRes.stderr, 3000)}`
        );
      }
      const buildRes = runNpmScriptWithRetry("build", 3);
      if (buildRes.status !== 0) {
        blockReasons.push(
          `build 실패:\n${truncate(buildRes.stdout + buildRes.stderr, 3000)}`
        );
      }
    } else {
      messages.push("ℹ️ package.json이 아직 없어 lint/build를 건너뜁니다.");
    }
  }

  if (blockReasons.length > 0) {
    const reason = blockReasons.join("\n\n");
    console.log(
      JSON.stringify({
        decision: "block",
        reason,
        systemMessage: reason,
      })
    );
    return;
  }

  if (messages.length > 0) {
    console.log(JSON.stringify({ systemMessage: messages.join("\n") }));
  }
}

main();
