# 스킬 사용 규칙

작업 단계(backlog.json의 `phase`)에 맞는 스킬을 놓치지 말고 먼저 로드한다. 아래는 이 프로젝트에 설치/제공된 스킬을 백로그 단계에 매핑한 것이다. 새 스킬을 설치하면 이 표도 같이 갱신한다.

## 이 프로젝트에 설치된 스킬 (`.claude/skills/`, `npx skills list`로 확인)

- **vitest** (`Skill` 툴로 호출 가능) — 테스트 작성/모킹/커버리지 설정할 때. `polish-qa` 단계(T027-T029)와 이후 코드에 테스트를 추가할 때 항상 이걸 먼저 로드한다.
- **drizzle**, **drizzle-migrations** — 레퍼런스 전용이라 `Skill` 툴 목록에는 안 뜬다(`disable-model-invocation: true`). Drizzle 스키마·쿼리·마이그레이션을 작성할 때(`data-model` 단계 T006-T09 등) `.claude/skills/drizzle/SKILL.md`와 `.claude/skills/drizzle-migrations/SKILL.md` (및 `references/*.md`)를 Read로 직접 참고한다.
- **supabase** (공식 Supabase 제공, `Skill` 툴로 호출 가능) — Supabase DB/Auth/Storage/Edge Functions/RLS/Supabase CLI·MCP 관련 작업 전부. DB가 Supabase로 확정됐으니(아래 참고) `setup`/`data-model`/`auth` 단계에서 반드시 먼저 로드한다. 특히 RLS·보안 체크리스트는 테이블 만들 때마다 확인.
- **supabase-postgres-best-practices** — Supabase Postgres 스키마/쿼리 설계 베스트 프랙티스. `drizzle`과 같이, 테이블 설계할 때 참고.
- **web-design-guidelines** (vercel-labs 제공) — 대쉬보드 UI를 실제로 구현/다듬을 때(특히 `dashboard-ui` 단계) 레이아웃·타이포·컴포넌트 일관성 참고.

## DB: Supabase (Neon 아님)

2026-09-17 사용자 지시로 DB는 **Supabase**로 확정. Supabase MCP(`/mcp`로 연결, `https://mcp.supabase.com/mcp`)가 연결되어 있으면 그걸로 프로젝트/테이블을 만들고, 연결이 안 돼 있으면 사용자에게 `/mcp` 연결을 먼저 요청한다 — `vercel:vercel-storage`의 Neon 흐름으로 임의 대체하지 않는다. `.claude/rules/code-style.md`의 스택 설명도 이 결정을 따른다.

## 단계별로 챙길 vercel:* 스킬 (플러그인 번들, 이미 로드됨)

| backlog phase | 참고할 스킬 |
|---|---|
| `setup` (T001-T005) | `vercel:bootstrap`, `vercel:vercel-cli`, `vercel:env-vars`, `supabase`(DB 프로비저닝) |
| `data-model` (T006-T009) | `supabase`, `supabase-postgres-best-practices`, `drizzle`/`drizzle-migrations`(위) |
| `backend-api` (T010-T014) | `vercel:vercel-functions`, `vercel:nextjs` |
| `auth` (T015) | `supabase`(Supabase Auth 우선 검토), `vercel:auth` |
| `dashboard-ui`/`task-crud-ui`/`report-ui` (T016-T026) | `vercel:nextjs`, `vercel:shadcn`, `vercel:react-best-practices`, `web-design-guidelines`, `dataviz`(워크로드 막대 등 수치 표현할 때), UI를 먼저 프로토타입할 땐 `artifact-design` |
| `polish-qa` (T027-T029) | `vitest`, `vercel:verification`(브라우저→API→데이터 전체 시나리오 점검), `run`(실제로 켜서 확인) |
| `deploy` (T030) | `vercel:deployments-cicd`, `vercel:vercel-cli` |

## 그 외

- 코드 변경을 리뷰할 때는 내장 `/code-review`(또는 `/simplify`)를, 배포 전에는 `/security-review`를 쓴다. 별도 서드파티 코드리뷰 스킬은 설치하지 않았다(중복이라 불필요).
- 스킬 목록에 없는 능력이 필요하면 바로 손으로 짜지 말고 `find-skills`로 먼저 찾아본다.
