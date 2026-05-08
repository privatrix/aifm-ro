/**
 * Session cookie helpers. Centralised so the cookie spec (name, attrs,
 * lifetime) lives in one place.
 */
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, SESSION_TTL_MS } from "@/lib/user-auth";

export function setSessionCookie(token: string, expiresAt: Date) {
  cookies().set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export function clearSessionCookie() {
  cookies().set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });
}

export function readSessionCookie(): string | null {
  const c = cookies().get(SESSION_COOKIE_NAME);
  return c?.value ?? null;
}
