import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookieEdge, ADMIN_COOKIE_NAME } from "@/lib/auth-edge";

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const ok = await verifyAdminCookieEdge(cookie, process.env.ADMIN_SECRET);
  if (ok) return NextResponse.next();

  if (pathname.startsWith("/api/admin")) {
    return new NextResponse(JSON.stringify({ ok: false, error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}
