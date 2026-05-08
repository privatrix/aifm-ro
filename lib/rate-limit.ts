/**
 * DB-backed sliding-window rate limit. Cheap to use, plenty for our scale.
 *
 * Usage:
 *   const ok = await rateLimitOk("signin", ipOrEmail, { limit: 5, windowMs: 15 * 60_000 });
 *   if (!ok) return 429;
 *
 * The `key` is hashed (SHA-256, hex) before storage so we never write raw IPs
 * or emails into the DB. Old rows are pruned opportunistically (1% chance per
 * call) so the table doesn't grow without bound.
 */
import { createHash } from "node:crypto";
import { and, eq, gt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { rateLimitLog } from "@/db/schema";

function hashKey(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

export interface RateLimitOptions {
  /** Max events allowed in the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export async function rateLimitOk(
  action: string,
  rawKey: string,
  opts: RateLimitOptions,
): Promise<boolean> {
  const keyHash = hashKey(rawKey);
  const since = new Date(Date.now() - opts.windowMs);
  const db = getDb();

  // Count recent attempts for this (action, key).
  const rows = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(rateLimitLog)
    .where(
      and(
        eq(rateLimitLog.action, action),
        eq(rateLimitLog.keyHash, keyHash),
        gt(rateLimitLog.createdAt, since),
      ),
    );
  const count = rows[0]?.c ?? 0;
  if (count >= opts.limit) return false;

  // Log this attempt.
  await db.insert(rateLimitLog).values({ action, keyHash });

  // Opportunistic prune (1% chance) of rows older than 24h. Keeps the table
  // bounded without needing a cron job.
  if (Math.random() < 0.01) {
    void db
      .delete(rateLimitLog)
      .where(gt(sql`now() - "created_at"`, sql`interval '24 hours'`))
      .catch(() => { /* swallow */ });
  }

  return true;
}
