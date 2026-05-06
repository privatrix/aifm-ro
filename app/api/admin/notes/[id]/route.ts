import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { notes } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Patch = z.object({
  status: z.enum(["pending", "read", "archived"]).optional(),
  reply: z.string().trim().max(500).nullable().optional(),
  public: z.boolean().optional(),
  fromName: z.string().trim().min(1).max(100).optional(),
});

function parseId(s: string) {
  const n = Number(s);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ ok: false, error: "bad id" }, { status: 400 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 }); }
  const parsed = Patch.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "validation", issues: parsed.error.issues }, { status: 400 });

  const updates: Record<string, unknown> = { ...parsed.data };
  if (updates.status === "read") {
    updates.readAt = new Date();
  }
  const [row] = await db.update(notes).set(updates).where(eq(notes.id, id)).returning();
  if (!row) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true, note: row });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ ok: false, error: "bad id" }, { status: 400 });
  await db.delete(notes).where(eq(notes.id, id));
  return NextResponse.json({ ok: true, deleted: true, id });
}
