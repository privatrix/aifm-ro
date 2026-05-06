import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { songs, notes, playHistory } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [songCount] = await db.select({ n: sql<number>`count(*)::int` }).from(songs);
  const [activeSongs] = await db.select({ n: sql<number>`count(*)::int` }).from(songs).where(sql`status='active'`);
  const [draftSongs] = await db.select({ n: sql<number>`count(*)::int` }).from(songs).where(sql`status='draft'`);
  const [archivedSongs] = await db.select({ n: sql<number>`count(*)::int` }).from(songs).where(sql`status='archived'`);
  const [pendingNotes] = await db.select({ n: sql<number>`count(*)::int` }).from(notes).where(sql`status='pending'`);
  const [readNotes] = await db.select({ n: sql<number>`count(*)::int` }).from(notes).where(sql`status='read'`);
  const [publicNotes] = await db.select({ n: sql<number>`count(*)::int` }).from(notes).where(sql`public=true`);
  const [totalPlays] = await db.select({ n: sql<number>`count(*)::int` }).from(playHistory);
  const [todayPlays] = await db.select({ n: sql<number>`count(*)::int` }).from(playHistory).where(sql`started_at > now() - interval '24 hours'`);

  // Top 10 voted active songs
  const topVoted = await db.execute(sql`
    SELECT id, title, genre, votes, played_count
    FROM aifm.songs
    WHERE status='active'
    ORDER BY votes DESC
    LIMIT 10
  `);

  // Listener count (unique fingerprints in last 60s)
  let listeners = 0;
  try {
    const r = await db.execute(sql`SELECT count(*)::int AS n FROM aifm.listener_heartbeat WHERE last_seen > now() - interval '60 seconds'`);
    const row = (r as unknown as { rows?: Array<{ n: number }> }).rows?.[0]
      ?? (Array.isArray(r) ? r[0] : null);
    listeners = (row?.n as number) ?? 0;
  } catch {}

  return NextResponse.json({
    ok: true,
    songs: {
      total: songCount.n,
      active: activeSongs.n,
      draft: draftSongs.n,
      archived: archivedSongs.n,
    },
    notes: {
      pending: pendingNotes.n,
      read: readNotes.n,
      public: publicNotes.n,
    },
    plays: {
      total: totalPlays.n,
      last24h: todayPlays.n,
    },
    listenersNow: listeners,
    topVoted: ((topVoted as unknown as { rows?: unknown[] }).rows ?? topVoted) as unknown,
  });
}
