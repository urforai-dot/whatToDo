export function todayIso() {
  return new Date().toISOString().slice(0, 10);
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
