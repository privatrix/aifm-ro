import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { db } from "@/db";
import { notes } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  text: z.string().trim().min(1).max(240),
  fromName: z.string().trim().min(1).max(100).optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }
  const { text, fromName } = parsed.data;
  const [row] = await db
    .insert(notes)
    .values({
      fromName: fromName ?? "anonim",
      text,
      status: "pending",
      timeLabel: new Date().toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" }),
    })
    .returning();
  return NextResponse.json({ ok: true, note: { id: row.id } });
}

// Public-readable note thread: notes that are read AND public.
export async function GET() {
  const rows = await db
    .select()
    .from(notes)
    .where(and(eq(notes.public, true), eq(notes.status, "read")))
    .orderBy(desc(notes.createdAt))
    .limit(40);
  return NextResponse.json({
    ok: true,
    notes: rows.map((r) => ({
      id: r.id,
      from: r.fromName,
      text: r.text,
      reply: r.reply,
      time: r.timeLabel,
    })),
  });
}
