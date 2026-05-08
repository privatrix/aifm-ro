/**
 * POST /api/me/password
 *
 * Body: { currentPassword, newPassword }
 *
 * Verifies the current password, hashes the new one, and rotates it. As a
 * security measure we ALSO destroy every other active session for this user
 * (anyone signed in elsewhere with stolen credentials gets kicked) and keep
 * only the current session alive.
 *
 * Rate-limited per (ip, userId): 5/15min — defends against brute-forcing the
 * current password from inside a stolen session.
 */
import { NextRequest, NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "@/db";
import { users, sessions } from "@/db/schema";
import {
  hashPassword,
  verifyPassword,
  validatePassword,
} from "@/lib/user-auth";
import { readSessionCookie } from "@/lib/session-cookie";
import { currentUser, unauthorized } from "@/lib/require-user";
import { rateLimitOk } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(): string {
  const h = headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return unauthorized();

  const ip = clientIp();
  const limited = !(await rateLimitOk(
    "password",
    `${ip}|${user.id}`,
    { limit: 5, windowMs: 15 * 60_000 },
  ));
  if (limited) {
    return NextResponse.json(
      { ok: false, error: "Prea multe încercări. Așteaptă câteva minute." },
      { status: 429 },
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch { body = {}; }
  const b = body as Record<string, unknown>;

  const current = String(b.currentPassword ?? "");
  const next    = String(b.newPassword ?? "");

  if (!current) {
    return NextResponse.json({ ok: false, error: "Introdu parola curentă." }, { status: 400 });
  }
  const newV = validatePassword(next);
  if (!newV.ok) {
    return NextResponse.json({ ok: false, error: newV.error }, { status: 400 });
  }
  if (current === next) {
    return NextResponse.json({ ok: false, error: "Parola nouă este aceeași cu cea curentă." }, { status: 400 });
  }

  const ok = await verifyPassword(current, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "Parola curentă e greșită." }, { status: 400 });
  }

  const newHash = await hashPassword(next);
  const db = getDb();
  await db
    .update(users)
    .set({ passwordHash: newHash, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  // Kill every session for this user EXCEPT the current one, so other devices
  // are signed out but the user's current device stays active.
  const currentSessionId = readSessionCookie() ?? "";
  await db
    .delete(sessions)
    .where(and(eq(sessions.userId, user.id), ne(sessions.id, currentSessionId)));

  return NextResponse.json({ ok: true });
}
