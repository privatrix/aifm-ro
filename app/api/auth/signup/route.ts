/**
 * POST /api/auth/signup
 *
 * Body: { email, password, displayName, handle }
 * Creates the user, default settings, and a session. Sets the session cookie
 * and returns the user shape used by the client.
 *
 * Errors are surfaced as 400 with a Romanian message in `{ ok: false, error }`.
 * Rate-limited per IP (5/15min) to stop bots.
 */
import { NextRequest, NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import {
  hashPassword,
  validateDisplayName,
  validateEmail,
  validateHandle,
  validatePassword,
  ensureSettings,
  createSession,
} from "@/lib/user-auth";
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

export async function POST(req: NextRequest) {
  const ip = clientIp();
  const limited = !(await rateLimitOk("signup", ip, { limit: 5, windowMs: 15 * 60_000 }));
  if (limited) {
    return NextResponse.json(
      { ok: false, error: "Prea multe încercări. Așteaptă câteva minute." },
      { status: 429 },
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch { body = {}; }
  const b = body as Record<string, unknown>;

  const emailV = validateEmail(String(b.email ?? ""));
  if (!emailV.ok) return NextResponse.json({ ok: false, error: emailV.error }, { status: 400 });

  const passV = validatePassword(String(b.password ?? ""));
  if (!passV.ok) return NextResponse.json({ ok: false, error: passV.error }, { status: 400 });

  const nameV = validateDisplayName(String(b.displayName ?? ""));
  if (!nameV.ok) return NextResponse.json({ ok: false, error: nameV.error }, { status: 400 });

  const handleV = validateHandle(String(b.handle ?? ""));
  if (!handleV.ok) return NextResponse.json({ ok: false, error: handleV.error }, { status: 400 });

  const db = getDb();

  // Check uniqueness explicitly so we can return a friendly Romanian message.
  // The unique indexes are still there as a safety net.
  const existing = await db
    .select({ id: users.id, email: users.email, handle: users.handle })
    .from(users)
    .where(or(eq(users.email, emailV.value), eq(users.handle, handleV.value)))
    .limit(2);
  for (const row of existing) {
    if (row.email === emailV.value) {
      return NextResponse.json({ ok: false, error: "Email deja folosit." }, { status: 400 });
    }
    if (row.handle === handleV.value) {
      return NextResponse.json({ ok: false, error: "Handle deja folosit." }, { status: 400 });
    }
  }

  const passwordHash = await hashPassword(String(b.password));
  const [created] = await db
    .insert(users)
    .values({
      email: emailV.value,
      passwordHash,
      displayName: nameV.value,
      handle: handleV.value,
    })
    .returning();

  await ensureSettings(created.id);

  const session = await createSession({
    userId: created.id,
    userAgent: headers().get("user-agent"),
    ip,
  });
  setSessionCookie(session.id, session.expiresAt);

  return NextResponse.json({
    ok: true,
    user: {
      id: created.id,
      email: created.email,
      displayName: created.displayName,
      handle: created.handle,
      bio: created.bio,
      city: created.city,
      avatarUrl: created.avatarUrl,
      createdAt: created.createdAt,
    },
  });
}
