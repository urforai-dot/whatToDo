# 코드 스타일 규칙

## 파일당 최대 줄수

`.js/.jsx/.ts/.tsx/.mjs/.cjs` 파일은 **300줄**을 넘기지 않는다 (`scripts/hooks/config.json`에서 조정 가능). 255줄(85%)부터 훅이 경고하고, 300줄(100%)을 넘기면 훅이 작업을 막고 다시 작업하라는 메시지를 띄운다 (`scripts/hooks/post-code-write.js`). 파일이 커지면 기능 단위로 쪼갠다 — 줄수를 줄이려고 줄바꿈만 압축하지 않는다.

## lint / build 강제

같은 훅이 코드/CSS 저장 시 `npm run lint --if-present`, `npm run build --if-present`를 실행하고 실패하면 작업을 막는다. `package.json`이 없는 지금(T001 이전)은 안내만 뜨고 건너뛴다 — Next.js 스캐폴딩(T001) 이후 자동으로 켜진다.

## 스택 (T001~T005에서 확정될 예정)

기본값은 Next.js App Router + TypeScript + Tailwind + shadcn/ui, DB는 Vercel Marketplace의 Postgres(Neon) + Drizzle ORM이다 (`backlog.json`의 `setup` phase 참고). 다른 스택으로 바뀌면 이 문서와 `backlog.json`의 관련 task 설명을 함께 갱신한다.

## 일반 원칙 (Claude Code 공통 정책과 동일)

- 요청 범위를 넘는 리팩터링/추상화를 얹지 않는다. task의 완료 조건(`tasks/<id>.md`)에 없는 일은 하지 않는다.
- 주석은 WHY가 비자명할 때만 한 줄. 무엇을 하는지 설명하는 주석은 쓰지 않는다.
- 발생할 수 없는 상황에 대한 방어 코드/검증을 추가하지 않는다. 경계(사용자 입력, 외부 API)에서만 검증한다.
