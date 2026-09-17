#!/usr/bin/env node
"use strict";

/**
 * backlog.json 조회/수정/추가용 CLI.
 * 의존성 없이 node만으로 실행: `node scripts/backlog-cli.js <command> [flags]`
 * `node scripts/backlog-cli.js --help` 로 전체 명령어 확인.
 *
 * 구현은 scripts/backlog-lib/ 아래에 나눠져 있다 (300줄 제한 때문):
 *   util.js            공용 유틸/IO
 *   commands-crud.js    list/show/add/update
 *   commands-report.js  next/stats/validate
 */

const { loadBacklog } = require("./backlog-lib/util");
const { cmdList, cmdShow, cmdAdd, cmdUpdate } = require("./backlog-lib/commands-crud");
const { cmdNext, cmdStats, cmdValidate } = require("./backlog-lib/commands-report");

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
      지정한 필드만 수정합니다. (alias: edit) --status를 바꾸면
      tasks/<id>.md의 "- **상태**:" 줄도 같이 갱신됩니다.

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

const { parseArgs } = require("./backlog-lib/util");

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
