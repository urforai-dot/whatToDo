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
    dbUnreachable = true;
  }

  // Fail closed: without the DB we can't verify this session actually
  // belongs to a real user, so don't render the dashboard as if it does
  // (a forged/stale cookie would otherwise sail through as "연결 안 됨").
  if (dbUnreachable) {
    return (
      <div className="text-muted-foreground flex min-h-screen flex-col items-center justify-center gap-2 text-sm">
        <p role="alert" aria-live="polite" className="text-destructive">
          서비스 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.
        </p>
      </div>
    );
  }

  if (!user) redirect("/login");

  return <DashboardShell userName={user.name}>{children}</DashboardShell>;
}
