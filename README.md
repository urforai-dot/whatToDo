# 섹션 업무 현황 대쉬보드

섹션원 10명을 위한 업무 진행상황·일정 대쉬보드 + 완료 업무 보고서 뷰. 배경/요구사항은 [`개발요구사항문서.md`](./개발요구사항문서.md), 작업 관리 방식은 [`CLAUDE.md`](./CLAUDE.md)와 [`.claude/rules/`](./.claude/rules)를 참고.

## 스택

Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, Supabase(Postgres) + Drizzle ORM, Vercel 배포.

## 로컬 개발

```bash
npm install
cp .env.example .env.local   # DATABASE_URL 등 채우기
npm run db:migrate           # 스키마 적용
npm run db:seed              # 샘플 데이터
npm run dev
```

## 백로그

작업은 `backlog.json`에 30분 단위 task로 관리된다. **직접 읽거나 고치지 말고** CLI를 쓴다:

```bash
node scripts/backlog-cli.js list
node scripts/backlog-cli.js show T001
node scripts/backlog-cli.js next
node scripts/backlog-cli.js stats
```

## 주요 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` / `npm run lint` | 빌드 / 린트 (파일 저장 시 훅으로 자동 실행됨) |
| `npm run db:generate` | Drizzle 스키마 변경 → 마이그레이션 SQL 생성 |
| `npm run db:migrate` | 마이그레이션을 DB에 적용 |
| `npm run db:seed` | 샘플 업무 12건 시드 (idempotent) |
| `npm run db:studio` | Drizzle Studio로 DB 들여다보기 |
