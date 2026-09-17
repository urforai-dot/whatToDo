import { inArray } from "drizzle-orm";
import type { db as Db } from "@/db/client";
import { users } from "@/db/schema";

/** De-dupes and returns which of the given ids don't exist in `users`. */
export async function findMissingUserIds(db: typeof Db, ownerIds: number[]) {
  const unique = Array.from(new Set(ownerIds));
  if (unique.length === 0) return { unique, missing: [] as number[] };
  const found = await db.select({ id: users.id }).from(users).where(inArray(users.id, unique));
  const foundIds = new Set(found.map((u) => u.id));
  return { unique, missing: unique.filter((id) => !foundIds.has(id)) };
}
