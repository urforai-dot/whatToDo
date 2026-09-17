import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db/client";
import { taskOwners, tasks, users } from "@/db/schema";
import { jsonOk } from "@/lib/api-response";

export async function GET() {
  // The `ne(status, 'done')` predicate lives in the join's ON clause, not
  // a WHERE after it — a WHERE there would silently turn both LEFT JOINs
  // into INNER JOINs (NULL fails the comparison) and drop users with zero
  // open tasks from the result.
  const rows = await db
    .select({
      userId: users.id,
      userName: users.name,
      taskId: tasks.id,
      status: tasks.status,
      dueDate: tasks.dueDate,
    })
    .from(users)
    .leftJoin(taskOwners, eq(taskOwners.userId, users.id))
    .leftJoin(tasks, and(eq(tasks.id, taskOwners.taskId), ne(tasks.status, "done")));

  const byUser = new Map<
    number,
    { userId: number; userName: string; taskCount: number; inProgressCount: number; nextDueDate: string | null }
  >();

  for (const row of rows) {
    const entry =
      byUser.get(row.userId) ??
      byUser
        .set(row.userId, { userId: row.userId, userName: row.userName, taskCount: 0, inProgressCount: 0, nextDueDate: null })
        .get(row.userId)!;

    if (row.taskId === null) continue;
    entry.taskCount += 1;
    if (row.status === "in_progress") entry.inProgressCount += 1;
    if (row.dueDate && (!entry.nextDueDate || row.dueDate < entry.nextDueDate)) {
      entry.nextDueDate = row.dueDate;
    }
  }

  return jsonOk(Array.from(byUser.values()));
}
