import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { vioLines } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(vioLines).where(eq(vioLines.enabled, true));
  if (rows.length === 0) {
    return NextResponse.json({ ok: true, lines: [] });
  }
  return NextResponse.json({
    ok: true,
    lines: rows.map(r => ({ id: r.id, text: r.text, band: r.band })),
  });
}
