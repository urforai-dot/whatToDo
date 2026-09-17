import type { TaskStatus } from "@/db/schema";

export type Owner = { id: number; name: string };

export type Task = {
  id: number;
  title: string;
  description: string | null;
  model: string | null;
  status: TaskStatus;
  priority: number;
  startDate: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  owners: Owner[];
};

export type Comment = {
  id: number;
  body: string;
  createdAt: string;
  authorId: number;
  authorName: string;
};

export type TaskDetail = Task & { comments: Comment[] };

export type WorkloadEntry = {
  userId: number;
  userName: string;
  taskCount: number;
  inProgressCount: number;
  nextDueDate: string | null;
};

export const STATUS_LABEL: Record<TaskStatus, string> = {
  planned: "예정",
  in_progress: "진행중",
  hold: "홀드",
  done: "완료",
};

// Task list priority badge: readability/attention over hue-consistency with
// the calendar. P1 uses the destructive (warm) token so it visibly alarms
// against the app's otherwise all-blue palette; lower priorities step down
// through accent, then secondary, then fade to plain muted text so the eye
// lands on what's urgent first.
export const PRIORITY_COLOR_CLASS: Record<number, string> = {
  1: "bg-destructive text-background",
  2: "bg-accent text-foreground",
  3: "bg-accent/55 text-foreground",
  4: "bg-secondary text-secondary-foreground",
  5: "text-muted-foreground",
};
