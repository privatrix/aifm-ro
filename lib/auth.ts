import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "aifm_admin";

function secret(): string {
  const s = process.env.ADMIN_SECRET;
  if (!s) throw new Error("ADMIN_SECRET not set");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

/** Issue a signed cookie value. payload = issuedAt timestamp (seconds). */
export function issueAdminCookie(): { name: string; value: string; maxAge: number } {
  const ts = Math.floor(Date.now() / 1000).toString();
  const sig = sign(ts);
  return { name: COOKIE_NAME, value: `${ts}.${sig}`, maxAge: 60 * 60 * 24 * 30 };
}

export function verifyAdminCookie(value: string | undefined): boolean {
  if (!value) return false;
  const dot = value.indexOf(".");
  if (dot < 0) return false;
  const ts = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  let expected: string;
  try {
    expected = sign(ts);
  } catch {
    return false;
  }
  if (sig.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
