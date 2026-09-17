-- Custom SQL migration file, put your code below! --

-- The status enum only existed in TypeScript; enforce it at the DB level
-- too, per T006's acceptance criteria ("enum 또는 제약된 값으로 정의됨").
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_status_check"
  CHECK ("status" IN ('planned', 'in_progress', 'hold', 'done'));
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_priority_check"
  CHECK ("priority" BETWEEN 1 AND 5);
