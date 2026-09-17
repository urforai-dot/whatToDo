# 섹션 업무 현황 대쉬보드

섹션원 10명을 위한 업무 진행상황·일정 대쉬보드 + 완료 업무 보고서 뷰. 전체 배경/요구사항은 `개발요구사항문서.md` 참고. 핵심 시나리오: 접속 → 우선순위/담당자 업무 로드 확인 → 업무 추가 → 완료 업무 확인.

## 지금 상태

- 실제 앱 코드는 아직 없음 (Next.js 스캐폴딩 = `backlog.json`의 `T001`, 아직 `todo`).
- 작업은 `backlog.json`에 30분 단위 task 30건으로 쪼개져 있고 (`node scripts/backlog-cli.js stats`로 현황 확인), 각 task의 상세는 `tasks/<id>.md`.
- 디자인 방향(대쉬보드 UI)은 Claude Design에서 "2a 위젯보드"안으로 확정, 프로토타입을 Artifact로 만들어둠. 실제 구현은 `dashboard-ui` phase의 task들에서 진행.

## 작업 시작 전에 반드시 읽을 것

- `.claude/rules/backlog.md` — backlog.json 다루는 법 (직접 만지지 말고 CLI로)
- `.claude/rules/git-workflow.md` — 브랜치, 자동 커밋/푸시
- `.claude/rules/code-style.md` — 줄수 제한, lint/build 강제, 스택
- `.claude/rules/subagents.md` — `backlog-briefer` / `adversarial-reviewer` 쓰는 시점

## 한 줄 요약 규칙

1. `backlog.json`은 절대 직접 Read/Edit/cat 하지 않는다 — `node scripts/backlog-cli.js ...`만 쓴다 (훅이 차단함).
2. `main`에서 직접 작업하지 않는다 — 세션 시작 시 훅이 안내하면 `dev`로 전환한다.
3. task를 시작하면 상태를 `in_progress`로, 판단이 필요하면 `needs_decision`으로 바꾸고 사용자에게 묻는다. 임의 추측으로 진행하지 않는다.
4. 코드 파일은 300줄을 넘기지 않는다, lint/build는 훅이 강제한다.
5. task를 시작하기 전 `backlog-briefer`로, 의미 있는 변경 직후 `adversarial-reviewer`로 점검한다 (둘 다 수동 호출 — 자동 hook 아님).
