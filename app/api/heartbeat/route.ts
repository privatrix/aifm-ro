import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lightweight listener heartbeat.
 *
 * We use a single tiny table `aifm.listener_heartbeat` (created on first call) to
 * count unique fingerprints seen in the last 60 seconds. This avoids spinning up
 * Redis just for a vanity counter.
 */

let inited = false;
async function ensureTable() {
  if (inited) return;
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS aifm.listener_heartbeat (
      fingerprint text PRIMARY KEY,
      last_seen   timestamptz NOT NULL DEFAULT now()
    )
  `);
  inited = true;
}

function fingerprint(req: NextRequest): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const ua = req.headers.get("user-agent") ?? "";
  return crypto.createHash("sha256").update(`${ip}::${ua}`).digest("hex").slice(0, 32);
}

export async function POST(req: NextRequest) {
  await ensureTable();
  const fp = fingerprint(req);
  await db.execute(sql`
    INSERT INTO aifm.listener_heartbeat (fingerprint, last_seen)
    VALUES (${fp}, now())
    ON CONFLICT (fingerprint) DO UPDATE SET last_seen = now()
  `);
  // Sweep stale rows (older than 5 min) — cheap.
  await db.execute(sql`DELETE FROM aifm.listener_heartbeat WHERE last_seen < now() - interval '5 minutes'`);
  const result = await db.execute(
    sql`SELECT count(*)::int AS n FROM aifm.listener_heartbeat WHERE last_seen > now() - interval '60 seconds'`,
  );
  // drizzle.execute returns { rows: [...] }
  const row = (result as unknown as { rows?: Array<{ n: number }> }).rows?.[0]
    ?? (Array.isArray(result) ? result[0] : null);
  const n = (row?.n as number) ?? 0;
  return NextResponse.json({ ok: true, listeners: n });
}

export async function GET() {
  await ensureTable();
  const result = await db.execute(
    sql`SELECT count(*)::int AS n FROM aifm.listener_heartbeat WHERE last_seen > now() - interval '60 seconds'`,
  );
  const row = (result as unknown as { rows?: Array<{ n: number }> }).rows?.[0]
    ?? (Array.isArray(result) ? result[0] : null);
  const n = (row?.n as number) ?? 0;
  return NextResponse.json({ ok: true, listeners: n });
}
