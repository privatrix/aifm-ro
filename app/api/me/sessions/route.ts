/**
 * GET    /api/me/sessions — list active sessions for the current user
 *                            (metadata only; tokens are never exposed).
 * DELETE /api/me/sessions — revoke every session EXCEPT the current one
 *                            ("sign out from all other devices").
 *
 * The current session is kept so the user doesn't surprise-log themselves
 * out from the device they're using to do the cleanup.
 */
import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { sessions } from "@/db/schema";
import { currentUser, unauthorized } from "@/lib/require-user";
import { readSessionCookie } from "@/lib/session-cookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();

  const db = getDb();
  const currentId = readSessionCookie() ?? "";
  const rows = await db
    .select({
      createdAt: sessions.createdAt,
      lastSeenAt: sessions.lastSeenAt,
      expiresAt: sessions.expiresAt,
      userAgent: sessions.userAgent,
      ip: sessions.ip,
      // Synthetic flag so the client can mark the current row.
      isCurrent: sessions.id,
    })
    .from(sessions)
    .where(eq(sessions.userId, user.id));

  // Map id -> boolean isCurrent so we don't leak the actual id.
  const safe = rows.map((r) => ({
    createdAt: r.createdAt,
    lastSeenAt: r.lastSeenAt,
    expiresAt: r.expiresAt,
    userAgent: r.userAgent,
    ip: r.ip,
    isCurrent: r.isCurrent === currentId,
  }));

  return NextResponse.json({ ok: true, sessions: safe });
}

export async function DELETE() {
  const user = await currentUser();
  if (!user) return unauthorized();

  const currentId = readSessionCookie() ?? "";
  const db = getDb();
  // Revoke everything except the current session.
  const result = await db
    .delete(sessions)
    .where(and(eq(sessions.userId, user.id), ne(sessions.id, currentId)))
    .returning({ id: sessions.id });

  return NextResponse.json({ ok: true, revoked: result.length });
}
