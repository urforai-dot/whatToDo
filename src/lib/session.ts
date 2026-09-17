import { cookies } from "next/headers";

export const SESSION_COOKIE = "session_user_id";

export async function getSessionUserId(): Promise<number | null> {
  const store = await cookies();
  const value = store.get(SESSION_COOKIE)?.value;
  if (!value) return null;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}
