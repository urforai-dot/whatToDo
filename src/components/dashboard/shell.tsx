import { LogoutButton } from "@/components/dashboard/logout-button";
import { DashboardRail } from "@/components/dashboard/rail";

export function DashboardShell({
  userName,
  children,
}: {
  userName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <DashboardRail />

      <div className="flex h-screen flex-1 flex-col">
        <header className="border-border flex flex-wrap items-baseline gap-3 border-b px-6 py-4">
          <h1 className="text-lg font-semibold">섹션 업무 현황판</h1>
          <div className="text-muted-foreground ml-auto flex items-center gap-4 text-sm">
            <span>{userName}</span>
            <LogoutButton />
          </div>
        </header>
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
