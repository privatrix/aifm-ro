/**
 * POST /api/auth/signin
 * Body: { email, password }
 *
 * Validates credentials, creates a session, sets the cookie. Generic error
 * message ("Email sau parolă greșită") on any failure to avoid leaking
 * which side was wrong (account-enumeration defence).
 *
 * Rate-limited per (IP, email) pair: 10/15min.
 */
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword, createSession, validateEmail } from "@/lib/user-auth";
import { setSessionCookie } from "@/lib/session-cookie";
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

const GENERIC_ERROR = "Email sau parolă greșită.";

export async function POST(req: NextRequest) {
  const ip = clientIp();

  let body: unknown;
  try { body = await req.json(); } catch { body = {}; }
  const b = body as Record<string, unknown>;

  const emailV = validateEmail(String(b.email ?? ""));
  if (!emailV.ok) {
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 400 });
  }

  // Rate limit the (ip, email) pair so a single attacker can't brute-force
  // many accounts and a single account can't be locked by a remote attacker
  // from arbitrary IPs.
  const limited = !(await rateLimitOk(
    "signin",
    `${ip}|${emailV.value}`,
    { limit: 10, windowMs: 15 * 60_000 },
  ));
  if (limited) {
    return NextResponse.json(
      { ok: false, error: "Prea multe încercări. Așteaptă câteva minute." },
      { status: 429 },
    );
  }

  const password = String(b.password ?? "");
  if (!password) {
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 400 });
  }

  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, emailV.value))
    .limit(1);

  // We always run argon2 verify to keep timing constant whether the email
  // exists or not. If the user doesn't exist we verify against a fixed
  // dummy hash so the attacker can't tell from response time.
  const stored = user?.passwordHash ?? "$argon2id$v=19$m=19456,t=2,p=1$dummysaltdummysalt$dummyhashdummyhashdummyhashdummyhash";
  const ok = await verifyPassword(password, stored);
  if (!user || !ok) {
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 400 });
  }

  const session = await createSession({
    userId: user.id,
    userAgent: headers().get("user-agent"),
    ip,
  });
  setSessionCookie(session.id, session.expiresAt);

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
  });
}
