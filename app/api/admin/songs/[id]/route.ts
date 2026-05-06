import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { songs } from "@/db/schema";
import { SongUpdateSchema } from "@/lib/songs";
import { deleteObject } from "@/lib/r2";
import { pickRandomGradient } from "@/lib/palettes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseId(s: string): number | null {
  const n = Number(s);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ ok: false, error: "bad id" }, { status: 400 });
  const [row] = await db.select().from(songs).where(eq(songs.id, id));
  if (!row) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true, song: row });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ ok: false, error: "bad id" }, { status: 400 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }
  const parsed = SongUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "validation", issues: parsed.error.issues }, { status: 400 });
  }
  const v = parsed.data;
  // Translate regenerateGradient flag into actual color values.
  const { regenerateGradient, ...rest } = v;
  const updates: Record<string, unknown> = { ...rest };
  if (regenerateGradient) {
    const [from, to] = pickRandomGradient();
    updates.gradientFrom = from;
    updates.gradientTo = to;
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: false, error: "empty" }, { status: 400 });
  }
  const [row] = await db.update(songs).set(updates).where(eq(songs.id, id)).returning();
  if (!row) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true, song: row });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ ok: false, error: "bad id" }, { status: 400 });
  const hard = req.nextUrl.searchParams.get("hard") === "true";

  const [existing] = await db.select().from(songs).where(eq(songs.id, id));
  if (!existing) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });

  if (hard) {
    if (existing.fileKey) {
      try {
        await deleteObject(existing.fileKey);
      } catch (e) {
        // Log but proceed — orphan blob is recoverable, broken link in UI is worse.
        console.warn("R2 delete failed for", existing.fileKey, (e as Error).message);
      }
    }
    await db.delete(songs).where(eq(songs.id, id));
    return NextResponse.json({ ok: true, deleted: true, id });
  }

  const [row] = await db.update(songs).set({ status: "archived" }).where(eq(songs.id, id)).returning();
  if (!row) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true, song: row });
}
