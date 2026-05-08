/**
 * POST   /api/me/favorites/:songId — add a favorite (idempotent).
 * DELETE /api/me/favorites/:songId — remove a favorite (idempotent).
 *
 * Returns the new favorite count for this user so the UI can reconcile.
 */
import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { userFavorites, songs } from "@/db/schema";
import { currentUser, unauthorized } from "@/lib/require-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Ctx { params: { songId: string } }

function parseSongId(s: string): number | null {
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function favCount(userId: number): Promise<number> {
  const db = getDb();
  const [r] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(userFavorites)
    .where(eq(userFavorites.userId, userId));
  return r?.c ?? 0;
}

export async function POST(_: Request, { params }: Ctx) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const songId = parseSongId(params.songId);
  if (!songId) return NextResponse.json({ ok: false, error: "Bad song id." }, { status: 400 });

  const db = getDb();
  // Verify the song exists before inserting (we don't have FKs).
  const [song] = await db.select({ id: songs.id }).from(songs).where(eq(songs.id, songId)).limit(1);
  if (!song) return NextResponse.json({ ok: false, error: "Song not found." }, { status: 404 });

  await db
    .insert(userFavorites)
    .values({ userId: user.id, songId })
    .onConflictDoNothing();

  return NextResponse.json({ ok: true, favorited: true, count: await favCount(user.id) });
}

export async function DELETE(_: Request, { params }: Ctx) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const songId = parseSongId(params.songId);
  if (!songId) return NextResponse.json({ ok: false, error: "Bad song id." }, { status: 400 });

  const db = getDb();
  await db
    .delete(userFavorites)
    .where(and(eq(userFavorites.userId, user.id), eq(userFavorites.songId, songId)));

  return NextResponse.json({ ok: true, favorited: false, count: await favCount(user.id) });
}
