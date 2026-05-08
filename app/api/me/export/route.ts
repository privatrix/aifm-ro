/**
 * GET /api/me/export — full data export for the current user.
 *
 * Returns a JSON document containing:
 *   - profile (everything stored in `users` except passwordHash)
 *   - settings
 *   - favorites (joined with songs for readability)
 *   - notes (the user's bilete + Vio's replies)
 *   - plays (per-song listening totals from user_plays)
 *   - votes (songs the user voted on, via vote_log.user_id)
 *   - sessions (active sessions metadata: NOT the tokens)
 *
 * Served as a downloadable file so the user can save it. Compliance with the
 * "right to data portability" expectation (GDPR Article 20).
 */
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  users,
  userSettings,
  userFavorites,
  userPlays,
  notes,
  voteLog,
  sessions,
  songs,
} from "@/db/schema";
import { currentUser, unauthorized } from "@/lib/require-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();

  const db = getDb();

  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, user.id))
    .limit(1);

  const favorites = await db
    .select({
      addedAt: userFavorites.createdAt,
      songId: userFavorites.songId,
      title: songs.title,
      genre: songs.genre,
    })
    .from(userFavorites)
    .innerJoin(songs, eq(songs.id, userFavorites.songId))
    .where(eq(userFavorites.userId, user.id));

  const myNotes = await db
    .select({
      id: notes.id,
      text: notes.text,
      status: notes.status,
      reply: notes.reply,
      timeLabel: notes.timeLabel,
      createdAt: notes.createdAt,
      readAt: notes.readAt,
      public: notes.public,
    })
    .from(notes)
    .where(eq(notes.userId, user.id));

  const plays = await db
    .select({
      songId: userPlays.songId,
      title: songs.title,
      startedAt: userPlays.startedAt,
      seconds: userPlays.seconds,
    })
    .from(userPlays)
    .innerJoin(songs, eq(songs.id, userPlays.songId))
    .where(eq(userPlays.userId, user.id));

  const myVotes = await db
    .select({
      songId: voteLog.songId,
      title: songs.title,
      createdAt: voteLog.createdAt,
    })
    .from(voteLog)
    .innerJoin(songs, eq(songs.id, voteLog.songId))
    .where(eq(voteLog.userId, user.id));

  // Sessions metadata only — never include the session id (token).
  const userSessions = await db
    .select({
      createdAt: sessions.createdAt,
      lastSeenAt: sessions.lastSeenAt,
      expiresAt: sessions.expiresAt,
      userAgent: sessions.userAgent,
      ip: sessions.ip,
    })
    .from(sessions)
    .where(eq(sessions.userId, user.id));

  const payload = {
    exportedAt: new Date().toISOString(),
    profile: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      handle: user.handle,
      bio: user.bio,
      city: user.city,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    settings,
    favorites,
    notes: myNotes,
    plays,
    votes: myVotes,
    sessions: userSessions,
  };

  // Pretty-printed JSON, served as a file. The Content-Disposition makes
  // browsers offer "Save As".
  const filename = `aifm-export-${user.handle}-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
