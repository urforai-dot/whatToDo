"use client";

import { useMemo, useState } from "react";
import type { Task } from "@/lib/dashboard-types";
import { isOverdue, toLocalIso, todayIso } from "@/lib/date-status";
import { Widget } from "@/components/dashboard/widget";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const MAX_VISIBLE_PER_DAY = 2;

type DayCell = { iso: string; day: number; inMonth: boolean };

function buildMonthCells(year: number, month: number): DayCell[] {
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;
  return Array.from({ length: totalCells }, (_, i) => {
    const d = new Date(year, month, 1 - startWeekday + i);
    return { iso: toLocalIso(d), day: d.getDate(), inMonth: d.getMonth() === month };
  });
}

export function CalendarWidget({
  tasks,
  onSelect,
}: {
  tasks: Task[];
  onSelect: (id: number) => void;
}) {
  const [monthOffset, setMonthOffset] = useState<0 | 1>(0);
  const today = todayIso();

  const base = new Date();
  const target = new Date(base.getFullYear(), base.getMonth() + monthOffset, 1);
  const year = target.getFullYear();
  const month = target.getMonth();

  const cells = useMemo(() => buildMonthCells(year, month), [year, month]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.dueDate || t.status === "done") continue;
      const list = map.get(t.dueDate) ?? [];
      list.push(t);
      map.set(t.dueDate, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.priority - b.priority);
    return map;
  }, [tasks]);

  return (
    <Widget title="달력 · 마감일" count={`${year}년 ${month + 1}월`}>
      <div className="flex gap-1.5 px-3.5 pt-2.5 pb-1.5">
        {([0, 1] as const).map((offset) => (
          <button
            key={offset}
            type="button"
            aria-pressed={monthOffset === offset}
            onClick={() => setMonthOffset(offset)}
            className={cn(
              "border px-2 py-0.5 text-[11px]",
              monthOffset === offset
                ? "bg-accent text-foreground border-accent"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {offset === 0 ? "이번달" : "다음달"}
          </button>
        ))}
      </div>
      <div className="px-3.5 pb-3">
        <div className="border-border/60 grid grid-cols-7 border-t border-l">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="border-border/60 text-muted-foreground border-r border-b py-1 text-center text-[10.5px]"
            >
              {label}
            </div>
          ))}
          {cells.map((cell) => {
            const dayTasks = tasksByDate.get(cell.iso) ?? [];
            const overflow = dayTasks.length - MAX_VISIBLE_PER_DAY;
            const isToday = cell.iso === today;
            return (
              <div
                key={cell.iso}
                className={cn(
                  "border-border/60 flex min-h-16 flex-col gap-0.5 border-r border-b p-1",
                  !cell.inMonth && !isToday && "opacity-40",
                  isToday && "bg-primary/10"
                )}
              >
                <span className="text-muted-foreground text-[10px] tabular-nums">{cell.day}</span>
                {dayTasks.slice(0, MAX_VISIBLE_PER_DAY).map((t) => {
                  const overdue = isOverdue(t.dueDate, t.status);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onSelect(t.id)}
                      aria-label={`${cell.iso} · ${t.title}`}
                      title={t.title}
                      className={cn(
                        "hover:bg-foreground/5 truncate text-left text-[10px] leading-tight",
                        overdue ? "text-destructive" : "text-primary"
                      )}
                    >
                      {t.title}
                    </button>
                  );
                })}
                {overflow > 0 && <span className="text-muted-foreground text-[10px]">+{overflow}건</span>}
              </div>
            );
          })}
        </div>
      </div>
    </Widget>
  );
}
