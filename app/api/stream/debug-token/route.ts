import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * TEMPORARY debug endpoint. DELETE AFTER DEBUGGING.
 */
export async function GET() {
  const t = process.env.STREAM_HEARTBEAT_TOKEN || "";
  let dbInfo: Record<string, unknown> = {};
  try {
    const r = await db.execute(sql`SELECT current_database() AS db, current_setting('server_version') AS pgver, NOW() AS now`);
    const rows = (r as unknown as { rows?: Array<Record<string, unknown>> }).rows;
    dbInfo = rows?.[0] ?? {};
    const r2 = await db.execute(sql`SELECT id, current_song_id, started_at, last_heartbeat_at FROM aifm.playback_state WHERE id = 1`);
    const rows2 = (r2 as unknown as { rows?: Array<Record<string, unknown>> }).rows;
    dbInfo.playback = rows2?.[0] ?? null;
  } catch (err) {
    dbInfo = { error: (err as Error).message };
  }
  // Mask the database URL, show the host only.
  const dbUrl = process.env.DATABASE_URL || "";
  const m = dbUrl.match(/@([^/]+)\//);
  const dbHost = m?.[1] ?? "(unparseable)";

  return NextResponse.json({
    ok: true,
    token: { isSet: t.length > 0, length: t.length, head4: t.slice(0, 4), tail4: t.slice(-4) },
    dbHost,
    dbInfo,
    note: "remove this endpoint after debugging",
  });
}
