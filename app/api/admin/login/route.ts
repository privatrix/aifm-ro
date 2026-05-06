import { NextRequest, NextResponse } from "next/server";
import { constantTimeEqual, issueAdminCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json({ ok: false, error: "ADMIN_PASSWORD not set" }, { status: 500 });
  }
  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }
  const pw = body.password || "";
  if (!constantTimeEqual(pw, expected)) {
    return NextResponse.json({ ok: false, error: "Invalid password" }, { status: 401 });
  }
  const c = issueAdminCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(c.name, c.value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: c.maxAge,
  });
  return res;
}
