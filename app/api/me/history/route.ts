/**
 * GET /api/me/history — last 30 days of personal listening history.
 * Aggregates per-song so the same song listened to multiple times is one row,
 * with total seconds and the most recent startedAt.
 */
import { NextResponse } from "next/server";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { userPlays, songs } from "@/db/schema";
import { currentUser, unauthorized } from "@/lib/require-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();

  const db = getDb();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      songId: userPlays.songId,
      title: songs.title,
      genre: songs.genre,
      gradientFrom: songs.gradientFrom,
      gradientTo: songs.gradientTo,
      freq: songs.freq,
      lastPlayed: sql<string>`max(${userPlays.startedAt})`.as("last_played"),
      totalSeconds: sql<number>`coalesce(sum(${userPlays.seconds}), 0)::int`.as("total_seconds"),
      plays: sql<number>`count(*)::int`.as("plays"),
    })
    .from(userPlays)
    .innerJoin(songs, eq(songs.id, userPlays.songId))
    .where(and(eq(userPlays.userId, user.id), gt(userPlays.startedAt, since)))
    .groupBy(userPlays.songId, songs.title, songs.genre, songs.gradientFrom, songs.gradientTo, songs.freq)
    .orderBy(desc(sql`max(${userPlays.startedAt})`))
    .limit(100);

  return NextResponse.json({ ok: true, history: rows });
}
