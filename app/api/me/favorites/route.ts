/**
 * GET /api/me/favorites — list of favorited songs (id-ordered, joined with
 * the songs table for display).
 */
import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { getDb } from "@/db";
import { userFavorites, songs } from "@/db/schema";
import { currentUser, unauthorized } from "@/lib/require-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();

  const db = getDb();
  const rows = await db
    .select({
      id: songs.id,
      title: songs.title,
      genre: songs.genre,
      durationSeconds: songs.durationSeconds,
      bpm: songs.bpm,
      gradientFrom: songs.gradientFrom,
      gradientTo: songs.gradientTo,
      freq: songs.freq,
      votes: songs.votes,
      fileUrl: songs.fileUrl,
      addedAt: userFavorites.createdAt,
    })
    .from(userFavorites)
    .innerJoin(songs, eq(songs.id, userFavorites.songId))
    .where(eq(userFavorites.userId, user.id))
    .orderBy(desc(userFavorites.createdAt));

  return NextResponse.json({ ok: true, favorites: rows });
}
