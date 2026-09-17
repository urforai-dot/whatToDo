"use client";

import { useState } from "react";
import { useDashboardData } from "@/components/dashboard/use-dashboard-data";
import { TaskDetailPanel } from "@/components/dashboard/task-detail-panel";
import { Widget, EmptyRow } from "@/components/dashboard/widget";
import { shortDate } from "@/lib/date-status";

export default function HistoryPage() {
  const { tasks, error, loading, reload } = useDashboardData();
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  if (loading && !tasks) {
    return <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">불러오는 중...</div>;
  }
  if (error) {
    return <div className="text-destructive flex flex-1 items-center justify-center text-sm">{error}</div>;
  }

  const done = (tasks ?? []).filter((t) => t.status === "done");

  if (selectedTaskId !== null) {
    return (
      <div className="max-w-2xl p-5">
        <TaskDetailPanel
          taskId={selectedTaskId}
          onBack={() => setSelectedTaskId(null)}
          onChanged={reload}
          onOpenTask={setSelectedTaskId}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl p-5">
      <Widget title="완료 업무 · History" count={`${done.length}건`}>
        {done.length === 0 && <EmptyRow>완료된 업무가 없습니다.</EmptyRow>}
        {done.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSelectedTaskId(t.id)}
            className="border-border/60 hover:bg-foreground/5 flex items-center gap-3 border-b px-3.5 py-2 text-left last:border-b-0"
          >
            <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">{t.title}</span>
            <span className="text-muted-foreground flex-none text-[11px]">
              {t.owners.length ? t.owners.map((o) => o.name).join(", ") : "미배정"}
            </span>
            <span className="text-muted-foreground flex-none text-[11px] tabular-nums">{shortDate(t.dueDate)}</span>
          </button>
        ))}
      </Widget>
    </div>
  );
}
