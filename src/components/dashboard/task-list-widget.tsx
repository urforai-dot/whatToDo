import { STATUS_LABEL, type Task } from "@/lib/dashboard-types";
import { isOverdue, shortDate } from "@/lib/date-status";
import { Widget, EmptyRow } from "@/components/dashboard/widget";
import { cn } from "@/lib/utils";

export function TaskListWidget({
  tasks,
  selectedTaskId,
  onSelect,
}: {
  tasks: Task[];
  selectedTaskId: number | null;
  onSelect: (id: number) => void;
}) {
  const open = tasks.filter((t) => t.status !== "done");
  const rows = [...open].sort(
    (a, b) => a.priority - b.priority || (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999")
  );
  const counts = {
    run: open.filter((t) => t.status === "in_progress").length,
    plan: open.filter((t) => t.status === "planned").length,
    hold: open.filter((t) => t.status === "hold").length,
  };
  const overdueCount = open.filter((t) => isOverdue(t.dueDate, t.status)).length;
  const doneCount = tasks.length - open.length;

  return (
    <Widget
      title="업무 목록 · 우선순위 순"
      count={`진행 ${counts.run} · 예정 ${counts.plan} · 홀드 ${counts.hold}`}
      footer={
        <div className="border-border text-muted-foreground flex items-center gap-2.5 border-t px-3.5 py-2 text-[11px]">
          <span className="text-destructive">마감 초과 {overdueCount}건</span>
          <span>· 완료 {doneCount}건 숨김</span>
          <span className="ml-auto">행 클릭 → 코멘트</span>
        </div>
      }
    >
      {rows.length === 0 && <EmptyRow>표시할 업무가 없습니다.</EmptyRow>}
      {rows.map((t) => {
        const overdue = isOverdue(t.dueDate, t.status);
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            aria-pressed={t.id === selectedTaskId}
            className={cn(
              "border-border/60 flex items-center gap-3 border-b px-3.5 py-1.5 text-left last:border-b-0",
              "hover:bg-foreground/5 focus-visible:bg-foreground/5",
              t.id === selectedTaskId && "bg-primary/10"
            )}
          >
            <span className="font-heading text-primary w-6 flex-none text-[13px] font-semibold">P{t.priority}</span>
            <span className={cn("min-w-0 flex-1 truncate text-[12.5px] font-medium", overdue && "text-destructive")}>
              {t.title}
            </span>
            <span className="text-muted-foreground hidden w-[70px] flex-none text-right text-[11px] tabular-nums sm:inline">
              {t.model ?? "—"}
            </span>
            <span className="text-muted-foreground hidden w-[92px] flex-none truncate text-[11px] md:inline">
              {t.owners.length ? t.owners.map((o) => o.name).join(", ") : "미배정"}
            </span>
            <span className="font-heading text-primary hidden w-[42px] flex-none text-[11px] font-semibold tracking-wide sm:inline">
              {STATUS_LABEL[t.status]}
            </span>
            <span
              className={cn(
                "w-[56px] flex-none text-right text-[11px] tabular-nums",
                overdue && "text-destructive"
              )}
            >
              {shortDate(t.dueDate)}
            </span>
          </button>
        );
      })}
    </Widget>
  );
}
