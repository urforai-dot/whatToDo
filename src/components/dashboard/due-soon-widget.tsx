import type { Task } from "@/lib/dashboard-types";
import { dueLabel, shortDate, todayIso, dayDiff } from "@/lib/date-status";
import { Widget, EmptyRow } from "@/components/dashboard/widget";
import { cn } from "@/lib/utils";

const DUE_SOON_WINDOW_DAYS = 14;

export function DueSoonWidget({ tasks }: { tasks: Task[] }) {
  const today = todayIso();
  const rows = tasks
    .filter((t) => t.status !== "done" && t.dueDate && dayDiff(today, t.dueDate) <= DUE_SOON_WINDOW_DAYS)
    .slice()
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));

  return (
    <Widget title="마감 임박 · Due" count={`${rows.length}건`}>
      {rows.length === 0 && <EmptyRow>임박한 마감이 없습니다.</EmptyRow>}
      {rows.map((t) => {
        const danger = dayDiff(today, t.dueDate!) < 0;
        return (
          <div key={t.id} className="border-border/60 flex items-center gap-3 border-b px-3.5 py-1.5 last:border-b-0">
            <span
              className={cn(
                "font-heading w-14 flex-none text-[11.5px] font-semibold tracking-wide tabular-nums",
                danger ? "text-destructive" : "text-primary"
              )}
            >
              {dueLabel(t.dueDate!)}
            </span>
            <span className={cn("min-w-0 flex-1 truncate text-[12.5px]", danger && "text-destructive")}>
              {t.title}
            </span>
            <span className="text-muted-foreground hidden max-w-20 flex-none truncate text-[11px] sm:inline">
              {t.owners.length ? t.owners.map((o) => o.name).join(", ") : "미배정"}
            </span>
            <span className="text-muted-foreground flex-none text-[11px] tabular-nums">{shortDate(t.dueDate)}</span>
          </div>
        );
      })}
    </Widget>
  );
}
