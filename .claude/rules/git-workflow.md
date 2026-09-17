# Git 워크플로 규칙

## 브랜치

세션 시작 시 훅(`scripts/hooks/session-start-branch.js`)이 현재 브랜치를 알려주고, `main`/`master`면 `dev`로 전환하라고 안내한다. **일반 개발 작업은 `main`에서 바로 하지 않는다.** `dev`가 없으면 `git checkout -b dev`, 있으면 `git checkout dev`로 전환한 뒤 작업을 시작한다. `main`은 배포/안정 브랜치로 남겨둔다.

## 커밋은 대부분 훅이 만든다

- `backlog.json` 변경(CLI를 통해서만 가능) → 훅이 자동으로 `chore(backlog): ...` 커밋.
- task 상태가 `done`으로 바뀌면 → 훅이 `git add -A` 후 완료 요약 커밋을 만들고 **자동으로 push**한다.

코드 파일(Next.js 앱 등)을 직접 커밋해야 할 때는 평소 Claude Code 정책대로 사용자가 명시적으로 요청할 때만 `git commit`한다 — 위 두 자동 커밋 경로와 섞이지 않도록, backlog 상태를 바꾸는 시점과 별개의 코드 커밋을 임의로 만들지 않는다.

## push

- 자동 push는 `done` 전이 시 훅이 하는 것 하나뿐이다.
- **그 외 커밋은 사용자가 "커밋해줘"라고 하면 커밋 직후 바로 push까지 한다** (2026-09-17 사용자 지시: "앞으로 커밋은 무조건 푸시해줘"). 커밋만 하고 푸시 여부를 따로 묻지 않는다. 단, 커밋 자체는 여전히 사용자가 명시적으로 요청했을 때만 만든다 — 임의로 커밋하지 않는다.
- `main`으로의 강제 push, `--force`, `reset --hard` 등 파괴적 작업은 사용자의 명시적 승인 없이 절대 하지 않는다 (Claude Code 공통 정책). 이 자동 push 규칙이 강제 push를 허용하는 건 아니다.
