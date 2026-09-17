import { LogoutButton } from "@/components/dashboard/logout-button";

const RAIL_ITEMS = [
  { label: "목록", href: "/", active: true, title: "업무 목록 (현재 화면)" },
  { label: "인원", href: null, title: "인원별 보기 — 준비 중" },
  { label: "마감", href: null, title: "마감 캘린더 — 준비 중" },
  { label: "이력", href: null, title: "변경 이력 — 준비 중" },
] as const;

export function DashboardShell({
  userName,
  children,
}: {
  userName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <nav aria-label="화면 전환" className="bg-card border-border flex w-14 flex-none flex-col items-center gap-2 border-r py-4">
        {RAIL_ITEMS.map((item) =>
          item.href ? (
            <a
              key={item.label}
              href={item.href}
              title={item.title}
              className="bg-primary text-primary-foreground font-heading flex h-9.5 w-9.5 flex-none items-center justify-center border text-xs font-semibold"
            >
              {item.label}
            </a>
          ) : (
            <span
              key={item.label}
              title={item.title}
              aria-disabled
              className="text-muted-foreground border-border flex h-9.5 w-9.5 flex-none cursor-not-allowed items-center justify-center border text-xs font-semibold"
            >
              {item.label}
            </span>
          )
        )}
      </nav>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="border-border flex flex-wrap items-baseline gap-3 border-b px-6 py-4">
          <h1 className="text-lg font-semibold">섹션 업무 현황판</h1>
          <div className="text-muted-foreground ml-auto flex items-center gap-4 text-sm">
            <span>{userName}</span>
            <LogoutButton />
          </div>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
