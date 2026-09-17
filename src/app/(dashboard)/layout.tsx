import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { DashboardShell } from "@/components/dashboard/shell";
import { getSessionUserId } from "@/lib/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const userId = await getSessionUserId();
  if (userId === null) redirect("/login");

  // `redirect()` throws a special value Next.js must see uncaught, so the
  // DB call is isolated in its own try/catch and the redirect decision is
  // made outside it — catching redirect()'s throw here would silently
  // swallow the navigation and fall through instead.
  let user: { name: string } | undefined;
  let dbUnreachable = false;
  try {
    [user] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId));
  } catch {
    // DB not reachable yet (e.g. before Supabase is connected) — still
    // render the shell rather than crashing the whole route.
    dbUnreachable = true;
  }

  if (!dbUnreachable && !user) redirect("/login");
  const userName = user?.name ?? "연결 안 됨";

  return <DashboardShell userName={userName}>{children}</DashboardShell>;
}
