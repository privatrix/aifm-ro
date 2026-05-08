/**
 * GET    /api/me  — the current user + stats. 200 when signed in, 401 otherwise.
 * PATCH  /api/me  — update displayName / bio / city. (Email and handle are
 *                   immutable for now; changing them needs more thought.)
 * DELETE /api/me  — full account deletion. Removes user, sessions, settings,
 *                   favorites, plays, and nullifies notes/vote_log ownership
 *                   so historical data stays intact.
 */
import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  users,
  userFavorites,
  userPlays,
  userSettings,
  sessions,
  notes,
  voteLog,
} from "@/db/schema";
import { currentUser, requireUser, unauthorized, UnauthorizedError } from "@/lib/require-user";
import { validateDisplayName } from "@/lib/user-auth";
import { clearSessionCookie } from "@/lib/session-cookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();

  const db = getDb();
  const [favRow] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(userFavorites)
    .where(eq(userFavorites.userId, user.id));
  const [noteRow] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(notes)
    .where(eq(notes.userId, user.id));
  const [secRow] = await db
    .select({ s: sql<number>`coalesce(sum(seconds), 0)::int` })
    .from(userPlays)
    .where(eq(userPlays.userId, user.id));

  const seconds = secRow?.s ?? 0;
  const hours = Math.round(seconds / 3600);

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      handle: user.handle,
      bio: user.bio,
      city: user.city,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    },
    stats: {
      favorites: favRow?.c ?? 0,
      notes: noteRow?.c ?? 0,
      hoursListened: hours,
    },
  });
}

export async function PATCH(req: NextRequest) {
  let user;
  try { user = await requireUser(); }
  catch (e) { if (e instanceof UnauthorizedError) return unauthorized(); throw e; }

  let body: unknown;
  try { body = await req.json(); } catch { body = {}; }
  const b = body as Record<string, unknown>;

  const patch: Partial<{ displayName: string; bio: string; city: string }> = {};

  if (typeof b.displayName === "string") {
    const v = validateDisplayName(b.displayName);
    if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: 400 });
    patch.displayName = v.value;
  }
  if (typeof b.bio === "string") {
    const trimmed = b.bio.trim();
    if (trimmed.length > 240) {
      return NextResponse.json({ ok: false, error: "Bio prea lungă (max 240)." }, { status: 400 });
    }
    patch.bio = trimmed;
  }
  if (typeof b.city === "string") {
    const trimmed = b.city.trim();
    if (trimmed.length > 60) {
      return NextResponse.json({ ok: false, error: "Oraș prea lung." }, { status: 400 });
    }
    patch.city = trimmed;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: false, error: "Nimic de salvat." }, { status: 400 });
  }

  const db = getDb();
  await db
    .update(users)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  let user;
  try { user = await requireUser(); }
  catch (e) { if (e instanceof UnauthorizedError) return unauthorized(); throw e; }

  const db = getDb();
  // Order matters: nullify references before removing the user, then drop
  // the user row. We KEEP notes/votes for historical accuracy of the radio
  // (anonymizing them rather than deleting).
  await db.update(notes).set({ userId: null }).where(eq(notes.userId, user.id));
  await db.update(voteLog).set({ userId: null }).where(eq(voteLog.userId, user.id));
  await db.delete(userFavorites).where(eq(userFavorites.userId, user.id));
  await db.delete(userPlays).where(eq(userPlays.userId, user.id));
  await db.delete(userSettings).where(eq(userSettings.userId, user.id));
  await db.delete(sessions).where(eq(sessions.userId, user.id));
  await db.delete(users).where(eq(users.id, user.id));

  clearSessionCookie();
  return NextResponse.json({ ok: true });
}
