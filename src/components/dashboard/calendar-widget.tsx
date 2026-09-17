"use client";

import { useMemo, useState } from "react";
import type { Task } from "@/lib/dashboard-types";
import { dayDiff, isOverdue, toLocalIso, todayIso } from "@/lib/date-status";
import { Widget } from "@/components/dashboard/widget";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const MAX_LANES = 3;

// Sequential ramp (one hue, light→dark = low→high priority) rather than a
// categorical palette — priority is an ordinal severity, not a set of
// unrelated identities, so distinct hues per level would misencode it.
const PRIORITY_BAR_CLASS: Record<number, string> = {
  1: "bg-accent/90",
  2: "bg-accent/72",
  3: "bg-accent/56",
  4: "bg-accent/42",
  5: "bg-accent/30",
};

type DayCell = { iso: string; day: number; inMonth: boolean };
type LanedTask = { task: Task; lane: number; start: string; end: string };

function buildMonthCells(year: number, month: number): DayCell[] {
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;
  return Array.from({ length: totalCells }, (_, i) => {
    const d = new Date(year, month, 1 - startWeekday + i);
    return { iso: toLocalIso(d), day: d.getDate(), inMonth: d.getMonth() === month };
  });
}

function chunkWeeks(cells: DayCell[]): DayCell[][] {
  const weeks: DayCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

// A task with only one of the two dates is drawn as a single-day bar on
// whichever date it has; startDate later than dueDate (nothing stops a user
// from setting that) is swapped rather than producing a negative-width bar.
function taskRange(t: Task): [string, string] | null {
  const s = t.startDate ?? t.dueDate;
  const e = t.dueDate ?? t.startDate;
  if (!s || !e) return null;
  return s <= e ? [s, e] : [e, s];
}

// Lanes are assigned once across the whole visible grid (not per week) so a
// task that spans several weeks stays in the same row throughout — the
// earlier per-week version reassigned lanes independently each week, so the
// same bar visibly jumped rows crossing a week boundary. Fit is checked
// against real day-by-day occupancy, not just "ends after my last segment",
// so a task can't be dropped while the lane it wanted sits empty under it.
function assignLanes(cells: DayCell[], tasks: Task[]): LanedTask[] {
  const gridStart = cells[0].iso;
  const gridEnd = cells[cells.length - 1].iso;
  const totalDays = cells.length;

  const ranged = tasks
    .map((task) => ({ task, range: taskRange(task) }))
    .filter((x): x is { task: Task; range: [string, string] } => x.range !== null)
    .filter(({ range: [s, e] }) => s <= gridEnd && e >= gridStart)
    .sort((a, b) => a.task.priority - b.task.priority || a.range[0].localeCompare(b.range[0]));

  const laneOccupied = Array.from({ length: MAX_LANES }, () => new Array<boolean>(totalDays).fill(false));
  const laned: LanedTask[] = [];

  for (const { task, range } of ranged) {
    const startIdx = Math.max(0, dayDiff(gridStart, range[0]));
    const endIdx = Math.min(totalDays - 1, dayDiff(gridStart, range[1]));
    const lane = laneOccupied.findIndex((occupied) =>
      occupied.slice(startIdx, endIdx + 1).every((day) => !day)
    );
    if (lane === -1) continue; // more than MAX_LANES concurrent tasks somewhere in this span
    for (let i = startIdx; i <= endIdx; i++) laneOccupied[lane][i] = true;
    laned.push({ task, lane, start: range[0], end: range[1] });
  }

  return laned;
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
  const weeks = useMemo(() => chunkWeeks(cells), [cells]);
  const liveTasks = useMemo(() => tasks.filter((t) => t.status !== "done"), [tasks]);
  const laned = useMemo(() => assignLanes(cells, liveTasks), [cells, liveTasks]);
  const overflowCount = liveTasks.filter((t) => taskRange(t) !== null).length - laned.length;

  return (
    <Widget
      title="달력 · 일정"
      count={overflowCount > 0 ? `${year}년 ${month + 1}월 · +${overflowCount}건 안 보임` : `${year}년 ${month + 1}월`}
    >
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
      <div className="flex flex-col px-3.5 pb-3">
        <div className="grid grid-cols-7">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="text-muted-foreground py-1 text-center text-[10.5px]">
              {label}
            </div>
          ))}
        </div>
        {weeks.map((week) => {
          const weekStart = week[0].iso;
          const weekEnd = week[6].iso;
          const todayColIdx = today >= weekStart && today <= weekEnd ? dayDiff(weekStart, today) : -1;
          const segments = laned
            .filter((lt) => lt.start <= weekEnd && lt.end >= weekStart)
            .map((lt) => {
              const colStart = Math.max(0, dayDiff(weekStart, lt.start));
              const colEnd = Math.min(6, dayDiff(weekStart, lt.end));
              return { lt, colStart, colSpan: colEnd - colStart + 1 };
            });
          const laneCount = segments.reduce((max, s) => Math.max(max, s.lt.lane + 1), 0);

          return (
            <div key={weekStart} className="relative">
              {todayColIdx >= 0 && (
                <div
                  className="bg-primary/10 pointer-events-none absolute inset-y-0"
                  style={{ left: `${(todayColIdx / 7) * 100}%`, width: `${100 / 7}%` }}
                />
              )}
              <div className="border-border/60 grid grid-cols-7 border-t border-l">
                {week.map((cell) => (
                  <div
                    key={cell.iso}
                    className={cn(
                      "border-border/60 border-r border-b px-1 py-0.5",
                      !cell.inMonth && cell.iso !== today && "opacity-40"
                    )}
                  >
                    <span className="text-muted-foreground text-[10px] tabular-nums">{cell.day}</span>
                  </div>
                ))}
              </div>
              {laneCount > 0 && (
                <div
                  className="grid grid-cols-7 gap-px py-px"
                  style={{ gridTemplateRows: `repeat(${laneCount}, 1.05rem)` }}
                >
                  {segments.map(({ lt, colStart, colSpan }) => (
                    <button
                      key={lt.task.id}
                      type="button"
                      onClick={() => onSelect(lt.task.id)}
                      title={lt.task.title}
                      aria-label={`${lt.task.title} · ${lt.start} ~ ${lt.end}`}
                      style={{ gridColumn: `${colStart + 1} / span ${colSpan}`, gridRow: lt.lane + 1 }}
                      className={cn(
                        "truncate px-1 text-left text-[10px] leading-[1.05rem] text-foreground",
                        PRIORITY_BAR_CLASS[lt.task.priority],
                        isOverdue(lt.task.dueDate, lt.task.status) && "ring-destructive ring-1 ring-inset"
                      )}
                    >
                      {lt.task.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Widget>
  );
}
