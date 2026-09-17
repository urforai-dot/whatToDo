export function toLocalIso(date: Date) {
  // toISOString() gives the UTC calendar date, which is the *previous* day
  // from 00:00-08:59 KST — read local Y/M/D instead so this matches the
  // viewer's wall clock (this runs client-side, in the browser's own TZ).
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayIso() {
  return toLocalIso(new Date());
}

export function isOverdue(dueDate: string | null, status: string) {
  return !!dueDate && dueDate < todayIso() && status !== "done";
}

export function dayDiff(from: string, to: string) {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86400000);
}

export function dueLabel(dueDate: string) {
  const d = dayDiff(todayIso(), dueDate);
  if (d < 0) return `${-d}일 초과`;
  if (d === 0) return "오늘";
  return `D-${d}`;
}

export function shortDate(date: string | null) {
  return date ? date.slice(5) : "—";
}
