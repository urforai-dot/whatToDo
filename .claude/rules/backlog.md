# 백로그 규칙

이 프로젝트의 작업 단위는 `backlog.json`에 30분 단위 task로 쪼개져 있다 (`개발요구사항문서.md` 기반, 현재 30건).

## backlog.json은 직접 만지지 않는다

`backlog.json`은 Read/Edit/Write 및 `cat` 류 셸 명령이 훅으로 **차단**되어 있다 (`.claude/settings.json` + `scripts/hooks/guard-backlog-*.js`). 조회·수정·추가는 항상 `scripts/backlog-cli.js`를 통해서 한다:

- 조회: `node scripts/backlog-cli.js list [--status s] [--phase p] [--assignee name]`, `show <id>`, `next`, `stats`
- 수정: `node scripts/backlog-cli.js update <id> --status ... --assignee ... --dep ...` (alias `edit`)
- 추가: `node scripts/backlog-cli.js add --title ... --dep ...`
- 정합성 점검: `node scripts/backlog-cli.js validate`

`git` 명령(`git show`, `git diff` 등)으로 backlog.json 이력을 보는 것은 허용된다.

## 상태값

`todo`(할 일) → `in_progress`(작업중) → `needs_review`(리뷰 필요) / `needs_decision`(사람의 판단 필요) / `waiting`(대기) → `done`(완료), 그 외 `cancelled`(취소).

작업을 시작하면 `update <id> --status in_progress`로 바꾸고, 사람의 판단이 필요한 지점(스택/설계 결정 등)에 부딪히면 `needs_decision`으로 바꾸고 이유를 `--blocked-reason`에 남긴 뒤 사용자에게 물어본다. 임의로 넘겨짚어 진행하지 않는다.

## 상세 문서 (`tasks/<id>.md`)

각 task는 `tasks/<id>.md`에 목표·관련 요구사항·완료 조건이 적혀 있다. 작업을 시작하기 전에 반드시 이 문서를 읽는다. 관련 파일 정리가 안 되어 있으면 `.claude/rules/subagents.md`에 정의된 `backlog-briefer` subagent로 채운다.

## 자동 커밋

`backlog.json`이 CLI로 바뀌면 훅이 자동으로 커밋한다 (`chore(backlog): ...`). 어떤 task의 상태가 `done`으로 바뀌면 훅이 작업 중 변경된 파일 전체를 묶어 요약 커밋 + **push**까지 자동으로 한다 — 그러니 `done`으로 바꾸기 전에 그 task 범위의 작업이 실제로 끝났는지 확인한다. 자세한 흐름은 `.claude/rules/git-workflow.md` 참고.
