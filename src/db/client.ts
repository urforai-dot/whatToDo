import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// `postgres()` connects lazily (on first query), so a missing DATABASE_URL
// at build/import time is fine — the failure surfaces on the first real
// query, not here. Don't validate eagerly: that would break `next build`
// (which imports every route module to collect page data) whenever
// DATABASE_URL isn't set, e.g. before T004 provisions Supabase.
const connectionString = process.env.DATABASE_URL ?? "postgres://unset:unset@localhost:5432/unset";

const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
