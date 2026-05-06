import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { vioLines } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Patch = z.object({
  text: z.string().trim().min(1).max(300).optional(),
  band: z.enum(["morning", "day", "evening", "night"]).nullable().optional(),
  enabled: z.boolean().optional(),
});

function parseId(s: string) { const n = Number(s); return Number.isInteger(n) && n > 0 ? n : null; }

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ ok: false, error: "bad id" }, { status: 400 });
  let body: unknown; try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 }); }
  const parsed = Patch.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  const [row] = await db.update(vioLines).set(parsed.data).where(eq(vioLines.id, id)).returning();
  if (!row) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true, line: row });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ ok: false, error: "bad id" }, { status: 400 });
  await db.delete(vioLines).where(eq(vioLines.id, id));
  return NextResponse.json({ ok: true, deleted: true, id });
}
