import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { playbackState, playHistory, songs } from "@/db/schema";
import { pickNextSong } from "@/lib/dj";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Force-advance the broadcast to a new song. Used by the admin Settings panel.
 */
export async function POST() {
  const [state] = await db.select().from(playbackState).where(eq(playbackState.id, 1));
  const currentId = state?.currentSongId ?? null;
  const next = await pickNextSong(currentId);
  if (!next) return NextResponse.json({ ok: false, error: "no songs available" }, { status: 503 });

  const newStart = new Date();
  if (currentId) {
    await db
      .update(playHistory)
      .set({ endedAt: newStart })
      .where(sql`id = (SELECT id FROM aifm.play_history WHERE song_id = ${currentId} AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1)`);
    await db
      .update(songs)
      .set({ playedCount: sql`${songs.playedCount} + 1`, lastPlayedAt: newStart })
      .where(eq(songs.id, currentId));
  }
  if (state) {
    await db.update(playbackState).set({ currentSongId: next.id, startedAt: newStart }).where(eq(playbackState.id, 1));
  } else {
    await db.insert(playbackState).values({ id: 1, currentSongId: next.id, startedAt: newStart });
  }
  await db.insert(playHistory).values({ songId: next.id, startedAt: newStart });

  return NextResponse.json({ ok: true, current: { id: next.id, title: next.title } });
}
