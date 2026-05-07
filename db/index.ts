import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Keep the connection cache (handshake reuse), but force every query through
// fetch with cache:"no-store". Otherwise Vercel's Data Cache happily memoises
// SELECTs and we end up serving stale playback_state for hours.
neonConfig.fetchConnectionCache = true;
neonConfig.fetchOptions = { cache: "no-store" };

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
