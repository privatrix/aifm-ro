import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { playbackState } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/stream/heartbeat
 *
 * Called every few seconds by the aifm-stream encoder. Updates playback_state
 * with the song the broadcast is currently on, so /api/now can serve it
 * unchanged and the website stays in sync with the actual audio.
 *
 * Auth: Bearer ${STREAM_HEARTBEAT_TOKEN}. If the env var is unset (e.g. in
 * dev) the endpoint is open — fine, but set it in prod.
 *
 * Body:
 *   {
 *     songId:   number | null,
 *     title:    string | null,
 *     startedAt: ISO string | null,
 *     elapsedSeconds: number | null,
 *     bytesSent: number,
 *     encoderUptimeMs: number
 *   }
 */
export async function POST(req: NextRequest) {
  const expected = process.env.STREAM_HEARTBEAT_TOKEN;
  if (expected) {
    const auth = req.headers.get("authorization") || "";
    const token = auth.replace(/^Bearer\s+/i, "");
    if (token !== expected) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  let payload: {
    songId?: number | null;
    title?: string | null;
    startedAt?: string | null;
    elapsedSeconds?: number | null;
    bytesSent?: number;
    encoderUptimeMs?: number;
  } = {};
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const songId = typeof payload.songId === "number" ? payload.songId : null;
  const startedAt = payload.startedAt ? new Date(payload.startedAt) : null;

  // Upsert the singleton row id=1.
  try {
    await db
      .insert(playbackState)
      .values({
        id: 1,
        currentSongId: songId,
        startedAt: startedAt ?? new Date(),
        nextSongId: null,
      })
      .onConflictDoUpdate({
        target: playbackState.id,
        set: {
          currentSongId: songId,
          startedAt: startedAt ?? new Date(),
        },
      });
  } catch (err) {
    console.error("[stream/heartbeat] db error:", (err as Error).message);
    return NextResponse.json({ ok: false, error: "db" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    receivedAt: new Date().toISOString(),
    songId,
    elapsedSeconds: payload.elapsedSeconds ?? null,
  });
}

export async function GET() {
  // Quick health probe — useful for "is the encoder pinging us?" debugging.
  try {
    const rows = await db.select().from(playbackState).where(eq(playbackState.id, 1));
    const row = rows[0] ?? null;
    return NextResponse.json({
      ok: true,
      lastHeartbeat: row?.startedAt ?? null,
      currentSongId: row?.currentSongId ?? null,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
