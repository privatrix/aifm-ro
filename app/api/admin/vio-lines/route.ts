import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { vioLines } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Create = z.object({
  text: z.string().trim().min(1).max(300),
  band: z.enum(["morning", "day", "evening", "night"]).nullable().optional(),
  enabled: z.boolean().optional(),
});

export async function GET() {
  const rows = await db.select().from(vioLines).orderBy(desc(vioLines.id));
  return NextResponse.json({ ok: true, lines: rows });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 }); }
  const parsed = Create.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  const v = parsed.data;
  const [row] = await db.insert(vioLines).values({
    text: v.text,
    band: v.band ?? null,
    enabled: v.enabled ?? true,
  }).returning();
  return NextResponse.json({ ok: true, line: row });
}
