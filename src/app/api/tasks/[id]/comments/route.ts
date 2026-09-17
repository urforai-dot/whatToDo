import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { comments, tasks, users } from "@/db/schema";
import { jsonError, jsonOk } from "@/lib/api-response";
import { getSessionUserId } from "@/lib/session";

const createCommentSchema = z.object({
  body: z.string().trim().min(1, "내용을 입력하세요."),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return jsonError(400, "잘못된 id입니다.");

  const authorId = await getSessionUserId();
  if (authorId === null) return jsonError(401, "로그인이 필요합니다.");

  const body = await request.json().catch(() => null);
  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "입력값이 올바르지 않습니다.", parsed.error.flatten());
  }

  const [task] = await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.id, id));
  if (!task) return jsonError(404, "업무를 찾을 수 없습니다.");

  const [author] = await db.select({ name: users.name }).from(users).where(eq(users.id, authorId));
  if (!author) return jsonError(401, "세션이 유효하지 않습니다. 다시 로그인해주세요.");

  const [created] = await db
    .insert(comments)
    .values({ taskId: id, authorId, body: parsed.data.body })
    .returning();

  return jsonOk({ ...created, authorName: author.name }, 201);
}
