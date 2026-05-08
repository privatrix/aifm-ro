/**
 * Route-handler helpers for resolving the current user from the session
 * cookie. Two flavours:
 *
 *   - `currentUser()`   : returns the user or null. Use for endpoints that
 *                         have both anonymous and signed-in code paths.
 *   - `requireUser()`   : returns the user or throws an HTTP 401 response.
 *                         Wrap the route body in try/catch to forward.
 *
 * Both use the session cookie set by /api/auth/* and do a DB lookup. We do
 * not cache across requests; cost is one indexed SELECT.
 */
import { NextResponse } from "next/server";
import { readSessionCookie } from "@/lib/session-cookie";
import { getSessionUser } from "@/lib/user-auth";
import type { User } from "@/db/schema";

export async function currentUser(): Promise<User | null> {
  return getSessionUser(readSessionCookie());
}

/** Sentinel error: throw to short-circuit a route with 401. */
export class UnauthorizedError extends Error {
  constructor(message = "unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function requireUser(): Promise<User> {
  const u = await currentUser();
  if (!u) throw new UnauthorizedError();
  return u;
}

/** Map UnauthorizedError to a 401 JSON response. */
export function unauthorized() {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}
