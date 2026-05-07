import { NextRequest, NextResponse } from "next/server";
import { eq, sql, and, isNull } from "drizzle-orm";
import { db } from "@/db";
import { playbackState, playHistory, songs } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/stream/heartbeat
 *
 * Called every few seconds by the aifm-stream encoder. Updates playback_state
 * with the song the broadcast is currently on. When the songId changes
 * compared to what we have stored, close out the old play_history row, insert
 * a new one, and bump played_count + last_played_at on the new song.
 *
 * Auth: Bearer ${STREAM_HEARTBEAT_TOKEN}.
 *
 * Body:
 *   { songId, title, startedAt, elapsedSeconds, bytesSent, encoderUptimeMs }
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
  const startedAt = payload.startedAt ? new Date(payload.startedAt) : new Date();
  const heartbeatAt = new Date();

  try {
    const existing = await db.select().from(playbackState).where(eq(playbackState.id, 1));
    const prevSongId = existing[0]?.currentSongId ?? null;

    // Upsert the singleton row.
    await db
      .insert(playbackState)
      .values({
        id: 1,
        currentSongId: songId,
        startedAt,
        nextSongId: null,
        lastHeartbeatAt: heartbeatAt,
      })
      .onConflictDoUpdate({
        target: playbackState.id,
        set: {
          currentSongId: songId,
          startedAt,
          lastHeartbeatAt: heartbeatAt,
        },
      });

    // Song change → write history.
    if (songId !== null && songId !== prevSongId) {
      // Close out any open history rows for the previous song.
      if (prevSongId !== null) {
        await db
          .update(playHistory)
          .set({ endedAt: heartbeatAt })
          .where(and(eq(playHistory.songId, prevSongId), isNull(playHistory.endedAt)));
      }
      // New row for the new song.
      await db.insert(playHistory).values({ songId, startedAt });
      // Bump counters on the song.
      await db
        .update(songs)
        .set({
          playedCount: sql`${songs.playedCount} + 1`,
          lastPlayedAt: startedAt,
        })
        .where(eq(songs.id, songId));
    }
  } catch (err) {
    console.error("[stream/heartbeat] db error:", (err as Error).message);
    return NextResponse.json({ ok: false, error: "db" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    receivedAt: heartbeatAt.toISOString(),
    songId,
    elapsedSeconds: payload.elapsedSeconds ?? null,
  });
}

/** Quick health probe — useful for "is the encoder pinging us?" debugging. */
export async function GET() {
  try {
    const rows = await db.select().from(playbackState).where(eq(playbackState.id, 1));
    const row = rows[0] ?? null;
    const lastHb = row?.lastHeartbeatAt ?? null;
    const ageMs = lastHb ? Date.now() - new Date(lastHb).getTime() : null;
    return NextResponse.json({
      ok: true,
      lastHeartbeat: lastHb,
      ageMs,
      live: ageMs !== null && ageMs < 30_000,
      currentSongId: row?.currentSongId ?? null,
      startedAt: row?.startedAt ?? null,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
