import { and, asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { TASK_STATUSES, taskOwners, tasks, users } from "@/db/schema";
import { jsonError, jsonOk } from "@/lib/api-response";
import { findMissingUserIds } from "@/lib/task-owners";

const createTaskSchema = z.object({
  title: z.string().trim().min(1, "title은 필수입니다."),
  description: z.string().trim().optional(),
  model: z.string().trim().optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.number().int().min(1).max(5).optional(),
  startDate: z.string().date().optional(),
  dueDate: z.string().date().optional(),
  ownerIds: z.array(z.number().int()).optional(),
});

async function attachOwners<T extends { id: number }>(rows: T[]) {
  if (rows.length === 0) return rows.map((r) => ({ ...r, owners: [] as { id: number; name: string }[] }));
  const ids = rows.map((r) => r.id);
  const ownerRows = await db
    .select({ taskId: taskOwners.taskId, id: users.id, name: users.name })
    .from(taskOwners)
    .innerJoin(users, eq(taskOwners.userId, users.id))
    .where(inArray(taskOwners.taskId, ids));

  const byTask = new Map<number, { id: number; name: string }[]>();
  for (const o of ownerRows) {
    const list = byTask.get(o.taskId) ?? [];
    list.push({ id: o.id, name: o.name });
    byTask.set(o.taskId, list);
  }
  return rows.map((r) => ({ ...r, owners: byTask.get(r.id) ?? [] }));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const ownerParam = searchParams.get("owner");
  const priorityParam = searchParams.get("priority");
  const sort = searchParams.get("sort") === "due" ? "due" : "priority";

  const conditions = [];

  if (statusParam) {
    const statuses = statusParam.split(",");
    const invalid = statuses.filter((s) => !TASK_STATUSES.includes(s as (typeof TASK_STATUSES)[number]));
    if (invalid.length > 0) {
      return jsonError(400, `잘못된 status 값: ${invalid.join(", ")}`);
    }
    conditions.push(inArray(tasks.status, statuses as (typeof TASK_STATUSES)[number][]));
  }

  if (priorityParam) {
    const priority = Number(priorityParam);
    if (!Number.isInteger(priority)) return jsonError(400, "잘못된 priority 값입니다.");
    conditions.push(eq(tasks.priority, priority));
  }

  let ownerId: number | null = null;
  if (ownerParam) {
    ownerId = Number(ownerParam);
    if (!Number.isInteger(ownerId)) return jsonError(400, "잘못된 owner 값입니다.");
  }

  const rows = await db
    .select()
    .from(tasks)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(sort === "due" ? asc(tasks.dueDate) : asc(tasks.priority), asc(tasks.dueDate));

  let withOwners = await attachOwners(rows);

  if (ownerId !== null) {
    withOwners = withOwners.filter((r) => r.owners.some((o) => o.id === ownerId));
  }

  return jsonOk(withOwners);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "입력값이 올바르지 않습니다.", parsed.error.flatten());
  }
  const { ownerIds: rawOwnerIds, ...values } = parsed.data;

  let ownerIds: number[] = [];
  if (rawOwnerIds && rawOwnerIds.length > 0) {
    const { unique, missing } = await findMissingUserIds(db, rawOwnerIds);
    if (missing.length > 0) {
      return jsonError(400, `존재하지 않는 담당자 id: ${missing.join(", ")}`);
    }
    ownerIds = unique;
  }

  const created = await db.transaction(async (tx) => {
    const [row] = await tx.insert(tasks).values(values).returning();
    if (ownerIds.length > 0) {
      await tx.insert(taskOwners).values(ownerIds.map((userId) => ({ taskId: row.id, userId })));
    }
    return row;
  });

  const [withOwners] = await attachOwners([created]);
  return jsonOk(withOwners, 201);
}
