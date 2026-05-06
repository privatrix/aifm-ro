// Edge-safe HMAC verifier — used by middleware (no Node "crypto").
export const ADMIN_COOKIE_NAME = "aifm_admin";

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  const bytes = new Uint8Array(sig);
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex;
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyAdminCookieEdge(value: string | undefined, secret: string | undefined): Promise<boolean> {
  if (!value || !secret) return false;
  const dot = value.indexOf(".");
  if (dot < 0) return false;
  const ts = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = await hmacHex(secret, ts);
  return timingSafeEqualStr(sig, expected);
}
