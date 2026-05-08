/**
 * User auth: password hashing, session creation, session verification.
 *
 * - Argon2id for passwords (m=19MB, t=2, p=1; sane modern defaults).
 * - Sessions are stored in `aifm.sessions`. The session id IS the cookie
 *   value (64-char hex, ~256 bits of entropy). We never expose the user id
 *   or other claims in the cookie.
 * - 30-day rolling expiry: every successful verification bumps `expiresAt`
 *   forward and updates `lastSeenAt`.
 *
 * This module is Node-runtime only (uses node:crypto). The Edge middleware
 * only checks the COOKIE SHAPE; full session verification happens in route
 * handlers via `requireUser()`.
 */
import { hash, verify } from "@node-rs/argon2";
import { randomBytes } from "node:crypto";
import { eq, and, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { users, sessions, userSettings, type User } from "@/db/schema";

export const SESSION_COOKIE_NAME = "aifm_session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const ARGON_OPTS = {
  // 19 MiB memory cost. Balances mobile-CPU server load vs. brute-force resistance.
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, ARGON_OPTS);
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  try {
    return await verify(stored, plain);
  } catch {
    return false;
  }
}

/** Generate a fresh session id. 32 bytes -> 64 hex chars. */
export function newSessionId(): string {
  return randomBytes(32).toString("hex");
}

export interface CreateSessionInput {
  userId: number;
  userAgent?: string | null;
  ip?: string | null;
}

export async function createSession(input: CreateSessionInput): Promise<{ id: string; expiresAt: Date }> {
  const id = newSessionId();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await getDb().insert(sessions).values({
    id,
    userId: input.userId,
    expiresAt,
    userAgent: input.userAgent ?? null,
    ip: input.ip ?? null,
  });
  return { id, expiresAt };
}

export async function destroySession(id: string): Promise<void> {
  if (!id) return;
  await getDb().delete(sessions).where(eq(sessions.id, id));
}

/**
 * Look up a session by id and return the user. Returns null if the session
 * is missing, expired, or the user no longer exists. Bumps lastSeenAt and
 * extends expiresAt as a side effect (rolling expiry).
 */
export async function getSessionUser(id: string | undefined | null): Promise<User | null> {
  if (!id || id.length !== 64 || !/^[a-f0-9]+$/i.test(id)) return null;
  const db = getDb();
  const now = new Date();
  const rows = await db
    .select({ user: users, session: sessions })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, now)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  // Roll expiry forward + bump lastSeenAt. Best-effort; failure is non-fatal
  // (the session is already known-valid for this request).
  const newExpires = new Date(now.getTime() + SESSION_TTL_MS);
  void db
    .update(sessions)
    .set({ lastSeenAt: now, expiresAt: newExpires })
    .where(eq(sessions.id, id))
    .catch(() => { /* swallow */ });

  return row.user;
}

/**
 * Validate display name and handle inputs. Returns a normalized form or an
 * error message (in Romanian, since the UI is Romanian).
 */
export function validateDisplayName(value: string): { ok: true; value: string } | { ok: false; error: string } {
  const trimmed = value.trim();
  if (trimmed.length < 1) return { ok: false, error: "Numele nu poate fi gol." };
  if (trimmed.length > 40) return { ok: false, error: "Numele e prea lung (max 40)." };
  return { ok: true, value: trimmed };
}

export function validateHandle(value: string): { ok: true; value: string } | { ok: false; error: string } {
  const norm = value.trim().toLowerCase();
  if (norm.length < 3) return { ok: false, error: "Handle prea scurt (min 3)." };
  if (norm.length > 20) return { ok: false, error: "Handle prea lung (max 20)." };
  if (!/^[a-z0-9_]+$/.test(norm)) return { ok: false, error: "Doar litere, cifre și _ în handle." };
  return { ok: true, value: norm };
}

export function validateEmail(value: string): { ok: true; value: string } | { ok: false; error: string } {
  const norm = value.trim().toLowerCase();
  // Loose check: contains @, has a dot in the host, no whitespace.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(norm)) {
    return { ok: false, error: "Email invalid." };
  }
  if (norm.length > 200) return { ok: false, error: "Email prea lung." };
  return { ok: true, value: norm };
}

export function validatePassword(value: string): { ok: true } | { ok: false; error: string } {
  if (value.length < 8) return { ok: false, error: "Parola trebuie să aibă minim 8 caractere." };
  if (value.length > 256) return { ok: false, error: "Parola e prea lungă." };
  return { ok: true };
}

/** Idempotently create a default user_settings row. */
export async function ensureSettings(userId: number): Promise<void> {
  await getDb()
    .insert(userSettings)
    .values({ userId })
    .onConflictDoNothing();
}
