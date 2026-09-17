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
