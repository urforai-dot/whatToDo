"use client";

import { useEffect, useRef, useState } from "react";
import { useDashboardData } from "@/components/dashboard/use-dashboard-data";
import { TaskListWidget } from "@/components/dashboard/task-list-widget";
import { TaskDetailPanel } from "@/components/dashboard/task-detail-panel";
import { DueSoonWidget } from "@/components/dashboard/due-soon-widget";
import { OwnersWidget } from "@/components/dashboard/owners-widget";
import { AttentionWidget } from "@/components/dashboard/attention-widget";
import { CalendarWidget } from "@/components/dashboard/calendar-widget";
import { AddTaskBar } from "@/components/dashboard/add-task-bar";

export function DashboardBoard() {
  const { tasks, workload, error, loading, reload } = useDashboardData();
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // A row can be selected from a widget scrolled below the fold (e.g. the
  // calendar); without this the detail panel that swaps in up top is
  // invisible until the user scrolls up manually. Instant + direct
  // scrollTop assignment, not scrollTo({behavior:"smooth"}): the panel's
  // async fetch reflows the container a moment later and cancels an
  // in-flight smooth-scroll animation, leaving it stuck mid-scroll.
  useEffect(() => {
    if (selectedTaskId !== null && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [selectedTaskId]);

  if (loading && !tasks) {
    return <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">불러오는 중...</div>;
  }

  if (error && !tasks) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
        <p role="alert" aria-live="polite" className="text-destructive text-sm">
          {error}
        </p>
        <button type="button" onClick={reload} className="text-accent text-xs underline underline-offset-2">
          다시 시도
        </button>
      </div>
    );
  }

  const allTasks = tasks ?? [];
  const allWorkload = workload ?? [];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {error && (
        <div className="bg-destructive/10 border-destructive/40 flex items-center gap-3 border-b px-5 py-2">
          <p role="alert" aria-live="polite" className="text-destructive flex-1 text-xs">
            {error} — 화면에 보이는 내용은 마지막으로 불러온 데이터입니다.
          </p>
          <button type="button" onClick={reload} className="text-accent flex-none text-xs underline underline-offset-2">
            다시 시도
          </button>
        </div>
      )}
      <div
        ref={scrollRef}
        className="grid flex-1 grid-cols-1 gap-4 overflow-auto p-5 [overflow-anchor:none] lg:grid-cols-[1.1fr_1fr]"
      >
        <div className="flex flex-col gap-4">
          {selectedTaskId === null ? (
            <TaskListWidget tasks={allTasks} selectedTaskId={selectedTaskId} onSelect={setSelectedTaskId} />
          ) : (
            <TaskDetailPanel
              taskId={selectedTaskId}
              onBack={() => setSelectedTaskId(null)}
              onChanged={reload}
              onOpenTask={setSelectedTaskId}
            />
          )}
          <CalendarWidget tasks={allTasks} onSelect={setSelectedTaskId} />
        </div>
        <div className="flex flex-col gap-4">
          <DueSoonWidget tasks={allTasks} />
          <OwnersWidget workload={allWorkload} />
          <AttentionWidget tasks={allTasks} />
        </div>
      </div>
      <AddTaskBar onAdded={reload} />
    </div>
  );
}
