import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { songs, playbackState, playHistory, type Song } from "@/db/schema";
import { pickNextSong } from "@/lib/dj";
import { generateVioThought } from "@/lib/vio-llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Shape returned to the public app. Mirrors lib/data.ts Song. */
function shape(s: Song) {
  return {
    id: s.id,
    title: s.title,
    genre: s.genre,
    duration: secondsToClock(s.durationSeconds || 0),
    durationSeconds: s.durationSeconds || 0,
    votes: s.votes,
    gradient: [s.gradientFrom, s.gradientTo] as [string, string],
    bpm: s.bpm,
    freq: s.freq,
    fileUrl: s.fileUrl,
  };
}

function secondsToClock(s: number): string {
  if (!s || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

async function getOrInitState() {
  const existing = await db.select().from(playbackState).where(eq(playbackState.id, 1));
  if (existing.length > 0) return existing[0];
  // Initialize with a song picked from scratch.
  const first = await pickNextSong(null);
  if (!first) return null;
  await db.insert(playbackState).values({
    id: 1,
    currentSongId: first.id,
    startedAt: new Date(),
  });
  await db.insert(playHistory).values({ songId: first.id, startedAt: new Date() });
  return (await db.select().from(playbackState).where(eq(playbackState.id, 1)))[0];
}

/** Heartbeat is considered fresh if it arrived in the last LIVE_WINDOW_MS. */
const LIVE_WINDOW_MS = 30_000;

export async function GET() {
  const state = await getOrInitState();
  if (!state || !state.currentSongId) {
    return NextResponse.json({ ok: false, error: "no songs" }, { status: 503 });
  }

  const [current] = await db.select().from(songs).where(eq(songs.id, state.currentSongId));
  if (!current) {
    return NextResponse.json({ ok: false, error: "current song missing" }, { status: 500 });
  }

  const now = Date.now();
  const startedMs = state.startedAt ? new Date(state.startedAt).getTime() : now;
  const elapsedSec = Math.max(0, Math.floor((now - startedMs) / 1000));
  const durationSec = Math.max(1, current.durationSeconds || 180); // fallback to 3min if unknown

  const lastHb = state.lastHeartbeatAt ? new Date(state.lastHeartbeatAt).getTime() : 0;
  const liveAgeMs = lastHb ? now - lastHb : Infinity;
  const live = liveAgeMs <= LIVE_WINDOW_MS;

  // Live broadcast: trust the encoder. Don't auto-advance, just return what's
  // currently on air. Encoder will send a new heartbeat with the next songId
  // when the song changes.
  if (live) {
    const upNext = await pickNextSong(current.id);
    return NextResponse.json({
      ok: true,
      live: true,
      lastHeartbeatAt: state.lastHeartbeatAt?.toISOString?.() ?? null,
      current: shape(current),
      startedAt: state.startedAt?.toISOString?.() ?? new Date(startedMs).toISOString(),
      elapsedSeconds: elapsedSec,
      serverNow: new Date(now).toISOString(),
      upNext: upNext ? shape(upNext) : null,
    });
  }

  // No live encoder — fall back to the local-timer schedule.
  // If the current song has finished, advance.
  if (elapsedSec >= durationSec) {
    const next = await pickNextSong(current.id);
    if (next) {
      const newStart = new Date();
      // Close out previous play_history row.
      await db
        .update(playHistory)
        .set({ endedAt: newStart })
        .where(sql`id = (SELECT id FROM aifm.play_history WHERE song_id = ${current.id} AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1)`);
      // Increment played_count + last_played_at.
      await db
        .update(songs)
        .set({
          playedCount: sql`${songs.playedCount} + 1`,
          lastPlayedAt: newStart,
        })
        .where(eq(songs.id, current.id));
      // Write new playback_state.
      await db
        .update(playbackState)
        .set({ currentSongId: next.id, startedAt: newStart })
        .where(eq(playbackState.id, 1));
      // Append new play_history.
      await db.insert(playHistory).values({ songId: next.id, startedAt: newStart });

      // Fire-and-forget Vio thought generation for the new song.
      // (waitUntil would be ideal but we just dispatch and don't await.)
      if (process.env.ANTHROPIC_API_KEY) {
        void generateVioThought().catch(() => { /* swallow */ });
      }

      // Pick the song after that for "Up Next" preview.
      const upNext = await pickNextSong(next.id);

      return NextResponse.json({
        ok: true,
        live: false,
        lastHeartbeatAt: state.lastHeartbeatAt?.toISOString?.() ?? null,
        current: shape(next),
        startedAt: newStart.toISOString(),
        elapsedSeconds: 0,
        serverNow: new Date(now).toISOString(),
        upNext: upNext ? shape(upNext) : null,
      });
    }
  }

  // Still on the current song (local-timer mode).
  const upNext = await pickNextSong(current.id);
  return NextResponse.json({
    ok: true,
    live: false,
    lastHeartbeatAt: state.lastHeartbeatAt?.toISOString?.() ?? null,
    current: shape(current),
    startedAt: state.startedAt?.toISOString?.() ?? new Date(startedMs).toISOString(),
    elapsedSeconds: elapsedSec,
    serverNow: new Date(now).toISOString(),
    upNext: upNext ? shape(upNext) : null,
  });
}
