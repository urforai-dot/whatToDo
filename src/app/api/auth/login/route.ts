import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { jsonError, jsonOk } from "@/lib/api-response";
import { SESSION_COOKIE } from "@/lib/session";

const loginSchema = z.object({ userId: z.number().int() });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "userId가 필요합니다.");

  const [user] = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, parsed.data.userId));
  if (!user) return jsonError(404, "존재하지 않는 사용자입니다.");

  const store = await cookies();
  store.set(SESSION_COOKIE, String(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return jsonOk(user);
}

export async function DELETE() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  return jsonOk({ ok: true });
}
