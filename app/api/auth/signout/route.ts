/**
 * POST /api/auth/signout
 * Destroys the current session (if any) and clears the cookie. Idempotent.
 */
import { NextResponse } from "next/server";
import { destroySession } from "@/lib/user-auth";
import { readSessionCookie, clearSessionCookie } from "@/lib/session-cookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const id = readSessionCookie();
  if (id) {
    await destroySession(id).catch(() => { /* swallow */ });
  }
  clearSessionCookie();
  return NextResponse.json({ ok: true });
}
