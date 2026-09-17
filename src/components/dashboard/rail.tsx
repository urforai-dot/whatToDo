"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const RAIL_ITEMS = [
  { label: "목록", href: "/", title: "업무 목록" },
  { label: "이력", href: "/history", title: "완료 업무 이력" },
] as const;

export function DashboardRail() {
  const pathname = usePathname();

  return (
    <nav aria-label="화면 전환" className="bg-card border-border flex w-14 flex-none flex-col items-center gap-2 border-r py-4">
      {RAIL_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            title={item.title}
            className={cn(
              "font-heading flex h-9.5 w-9.5 flex-none items-center justify-center border text-xs font-semibold",
              active
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
