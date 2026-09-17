-- Custom SQL migration file, put your code below! --

-- Internal 10-person tool: no per-row tenancy, everyone sees/edits everything.
-- Enable RLS as defense-in-depth per Supabase guidance (all tables in an
-- exposed schema should have RLS on) even though the app talks to Postgres
-- via a direct Drizzle connection, not the anon/authenticated Data API.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "task_owners" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "comments" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_authenticated_all" ON "users"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "tasks_authenticated_all" ON "tasks"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "task_owners_authenticated_all" ON "task_owners"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "comments_authenticated_all" ON "comments"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
