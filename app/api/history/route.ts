import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { songs, playHistory, playbackState } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/history?limit=10
 *
 * Returns the most recent songs that played on air, newest first. Each entry
 * carries the song shape used by the public app, plus startedAt/endedAt and a
 * `current` flag for the one currently on the broadcast.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "10", 10)));

  try {
    const rows = await db
      .select({
        id: playHistory.id,
        songId: playHistory.songId,
        startedAt: playHistory.startedAt,
        endedAt: playHistory.endedAt,
        title: songs.title,
        genre: songs.genre,
        durationSeconds: songs.durationSeconds,
        votes: songs.votes,
        gradientFrom: songs.gradientFrom,
        gradientTo: songs.gradientTo,
        bpm: songs.bpm,
        freq: songs.freq,
      })
      .from(playHistory)
      .leftJoin(songs, eq(songs.id, playHistory.songId))
      .orderBy(desc(playHistory.startedAt))
      .limit(limit);

    const stateRows = await db.select().from(playbackState).where(eq(playbackState.id, 1));
    const currentSongId = stateRows[0]?.currentSongId ?? null;

    const items = rows
      .filter(r => r.title !== null)
      .map(r => ({
        playId: r.id,
        id: r.songId,
        title: r.title!,
        genre: r.genre!,
        durationSeconds: r.durationSeconds || 0,
        duration: secondsToClock(r.durationSeconds || 0),
        votes: r.votes ?? 0,
        gradient: [r.gradientFrom!, r.gradientTo!] as [string, string],
        bpm: r.bpm ?? 0,
        freq: r.freq ?? "",
        startedAt: r.startedAt instanceof Date ? r.startedAt.toISOString() : r.startedAt,
        endedAt: r.endedAt instanceof Date ? r.endedAt.toISOString() : r.endedAt,
        current: r.songId === currentSongId && !r.endedAt,
      }));

    return NextResponse.json({ ok: true, items });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

function secondsToClock(s: number): string {
  if (!s || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}
