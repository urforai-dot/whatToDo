import type { Task } from "@/lib/dashboard-types";
import { Widget, EmptyRow } from "@/components/dashboard/widget";

function reasonFor(t: Task) {
  if (t.status === "hold") return "홀드";
  if (t.owners.length === 0) return "미배정";
  return "일정 미정";
}

export function AttentionWidget({ tasks }: { tasks: Task[] }) {
  const rows = tasks.filter(
    (t) => t.status !== "done" && (t.status === "hold" || t.owners.length === 0 || !t.dueDate)
  );

  return (
    <Widget title="확인 필요" count={rows.length}>
      {rows.length === 0 && <EmptyRow>확인이 필요한 업무가 없습니다.</EmptyRow>}
      {rows.map((t) => (
        <div key={t.id} className="border-border/60 flex items-center gap-2.5 border-b px-3.5 py-1.5 last:border-b-0">
          <span className="font-heading text-primary w-[46px] flex-none text-[10.5px] font-semibold tracking-wide">
            {reasonFor(t)}
          </span>
          <span className="min-w-0 flex-1 truncate text-xs">{t.title}</span>
          <span className="text-muted-foreground flex-none text-[10.5px]">
            {t.owners.length ? t.owners.map((o) => o.name).join(", ") : "—"}
          </span>
        </div>
      ))}
    </Widget>
  );
}
