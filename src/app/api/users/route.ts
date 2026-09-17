import { asc } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { jsonOk } from "@/lib/api-response";

export async function GET() {
  const rows = await db.select({ id: users.id, name: users.name }).from(users).orderBy(asc(users.name));
  return jsonOk(rows);
}
