import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

neonConfig.fetchConnectionCache = true;

let _db: ReturnType<typeof drizzle> | null = null;

/**
 * Lazy DB accessor — throws only at call time if DATABASE_URL is missing,
 * so `next build` doesn't fail when env is not set yet.
 */
export function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Add Neon Postgres via the Vercel integration.");
  }
  const sql = neon(url);
  _db = drizzle(sql, { schema });
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_t, prop) {
    return (getDb() as unknown as Record<PropertyKey, unknown>)[prop as string];
  },
});

export { schema };
