import type { WorkloadEntry } from "@/lib/dashboard-types";
import { shortDate, todayIso } from "@/lib/date-status";
import { Widget } from "@/components/dashboard/widget";
import { cn } from "@/lib/utils";

export function OwnersWidget({ workload }: { workload: WorkloadEntry[] }) {
  const today = todayIso();
  return (
    <Widget title="담당자별 현황 · Owners" count={`${workload.length}명`}>
      <div className="grid grid-cols-1 sm:grid-cols-2">
        {workload.map((o) => {
          const overdue = !!o.nextDueDate && o.nextDueDate < today;
          const barWidth = o.taskCount ? Math.min(100, o.taskCount * 28) : 4;
          const state = o.inProgressCount
            ? `진행중 ${o.inProgressCount}건`
            : o.taskCount
              ? "예정만"
              : "여유";
          return (
            <div
              key={o.userId}
              className="border-border/60 flex items-center gap-2 border-b px-3.5 py-1.5 last:border-b-0"
            >
              <span className="w-11 flex-none truncate text-xs">{o.userName}</span>
              <span className="bg-border h-1.5 min-w-0 flex-1">
                <span className="bg-accent block h-1.5" style={{ width: `${barWidth}%` }} />
              </span>
              <span className="text-muted-foreground w-[52px] flex-none text-[10.5px]">{state}</span>
              <span
                className={cn(
                  "w-[38px] flex-none text-right text-[10.5px] tabular-nums",
                  overdue && "text-destructive"
                )}
              >
                {shortDate(o.nextDueDate)}
              </span>
            </div>
          );
        })}
      </div>
    </Widget>
  );
}
