import {
  bigint,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const TASK_STATUSES = ["planned", "in_progress", "hold", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const tasks = pgTable(
  "tasks",
  {
    id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    model: text("model"),
    status: text("status", { enum: TASK_STATUSES }).notNull().default("planned"),
    priority: integer("priority").notNull().default(3),
    startDate: date("start_date"),
    dueDate: date("due_date"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("tasks_status_idx").on(t.status),
    index("tasks_priority_idx").on(t.priority),
    index("tasks_due_date_idx").on(t.dueDate),
  ]
);

export const taskOwners = pgTable(
  "task_owners",
  {
    taskId: bigint("task_id", { mode: "number" })
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.taskId, t.userId] }),
    index("task_owners_user_id_idx").on(t.userId),
  ]
);

export const comments = pgTable(
  "comments",
  {
    id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
    taskId: bigint("task_id", { mode: "number" })
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    authorId: bigint("author_id", { mode: "number" })
      .notNull()
      .references(() => users.id),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("comments_task_id_idx").on(t.taskId),
    index("comments_author_id_idx").on(t.authorId),
  ]
);
