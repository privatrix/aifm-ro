import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * TEMPORARY debug endpoint — confirms what the deployed runtime sees as
 * STREAM_HEARTBEAT_TOKEN without leaking the secret. Returns length plus
 * first/last 4 chars only. DELETE AFTER DEBUGGING.
 */
export async function GET() {
  const t = process.env.STREAM_HEARTBEAT_TOKEN || "";
  return NextResponse.json({
    ok: true,
    isSet: t.length > 0,
    length: t.length,
    head4: t.slice(0, 4),
    tail4: t.slice(-4),
    hasNewline: /[\n\r]/.test(t),
    hasSpace: /\s/.test(t),
    note: "remove this endpoint after debugging",
  });
}
