"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const RAIL_ITEMS = [
  { label: "목록", href: "/", title: "업무 목록" },
  { label: "이력", href: "/history", title: "완료 업무 이력" },
  { label: "인원", href: null, title: "인원별 보기 — 준비 중" },
  { label: "마감", href: null, title: "마감 캘린더 — 준비 중" },
] as const;

export function DashboardRail() {
  const pathname = usePathname();

  return (
    <nav aria-label="화면 전환" className="bg-card border-border flex w-14 flex-none flex-col items-center gap-2 border-r py-4">
      {RAIL_ITEMS.map((item) => {
        if (!item.href) {
          return (
            <span
              key={item.label}
              title={item.title}
              aria-disabled
              className="text-muted-foreground border-border flex h-9.5 w-9.5 flex-none cursor-not-allowed items-center justify-center border text-xs font-semibold"
            >
              {item.label}
            </span>
          );
        }
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
