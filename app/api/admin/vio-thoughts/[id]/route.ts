import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { vioThoughts } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseId(s: string) { const n = Number(s); return Number.isInteger(n) && n > 0 ? n : null; }

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ ok: false, error: "bad id" }, { status: 400 });
  const body = await req.json().catch(() => null) as { approved?: boolean } | null;
  if (!body || typeof body.approved !== "boolean") {
    return NextResponse.json({ ok: false, error: "expected { approved }" }, { status: 400 });
  }
  const [row] = await db.update(vioThoughts).set({ approved: body.approved }).where(eq(vioThoughts.id, id)).returning();
  return NextResponse.json({ ok: !!row, thought: row });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ ok: false, error: "bad id" }, { status: 400 });
  await db.delete(vioThoughts).where(eq(vioThoughts.id, id));
  return NextResponse.json({ ok: true, deleted: true });
}
