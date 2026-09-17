import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { TASK_STATUSES, comments, taskOwners, tasks, users } from "@/db/schema";
import { jsonError, jsonOk } from "@/lib/api-response";
import { findMissingUserIds } from "@/lib/task-owners";

const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().nullable().optional(),
    model: z.string().trim().nullable().optional(),
    status: z.enum(TASK_STATUSES).optional(),
    priority: z.number().int().min(1).max(5).optional(),
    startDate: z.string().date().nullable().optional(),
    dueDate: z.string().date().nullable().optional(),
    ownerIds: z.array(z.number().int()).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "변경할 필드를 하나 이상 지정하세요.");

function parseId(idParam: string) {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function loadOwners(id: number) {
  return db
    .select({ id: users.id, name: users.name })
    .from(taskOwners)
    .innerJoin(users, eq(taskOwners.userId, users.id))
    .where(eq(taskOwners.taskId, id));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = parseId((await params).id);
  if (id === null) return jsonError(400, "잘못된 id입니다.");

  const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
  if (!task) return jsonError(404, "업무를 찾을 수 없습니다.");

  const owners = await loadOwners(id);

  const taskComments = await db
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      authorId: comments.authorId,
      authorName: users.name,
    })
    .from(comments)
    .innerJoin(users, eq(comments.authorId, users.id))
    .where(eq(comments.taskId, id))
    .orderBy(desc(comments.createdAt));

  return jsonOk({ ...task, owners, comments: taskComments });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = parseId((await params).id);
  if (id === null) return jsonError(400, "잘못된 id입니다.");

  const body = await request.json().catch(() => null);
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "입력값이 올바르지 않습니다.", parsed.error.flatten());
  }
  const { ownerIds: rawOwnerIds, ...values } = parsed.data;

  const [existing] = await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.id, id));
  if (!existing) return jsonError(404, "업무를 찾을 수 없습니다.");

  let ownerIds: number[] | null = null;
  if (rawOwnerIds) {
    const { unique, missing } = await findMissingUserIds(db, rawOwnerIds);
    if (missing.length > 0) {
      return jsonError(400, `존재하지 않는 담당자 id: ${missing.join(", ")}`);
    }
    ownerIds = unique;
  }

  await db.transaction(async (tx) => {
    if (Object.keys(values).length > 0) {
      await tx
        .update(tasks)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(tasks.id, id));
    }
    if (ownerIds !== null) {
      await tx.delete(taskOwners).where(eq(taskOwners.taskId, id));
      if (ownerIds.length > 0) {
        await tx.insert(taskOwners).values(ownerIds.map((userId) => ({ taskId: id, userId })));
      }
    }
  });

  const [updated] = await db.select().from(tasks).where(eq(tasks.id, id));
  const owners = await loadOwners(id);

  return jsonOk({ ...updated, owners });
}
