import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { parseBuffer } from "music-metadata";
import { db } from "@/db";
import { songs } from "@/db/schema";
import { getObjectBytes, publicUrl } from "@/lib/r2";
import { pickFreeFreq } from "@/lib/songs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Default gradient palette (cycled when creating new songs without one).
const DEFAULT_GRADIENTS: Array<[string, string]> = [
  ["#E91E8C", "#C2185B"],
  ["#8E24AA", "#6A1B9A"],
  ["#1565C0", "#0D47A1"],
  ["#7B1FA2", "#4A148C"],
  ["#E53935", "#C62828"],
  ["#F57C00", "#E64A19"],
  ["#AD1457", "#880E4F"],
  ["#00695C", "#006064"],
];

const Body = z.object({
  id: z.number().int().positive().optional(),
  key: z.string().min(1).max(500),
  fileName: z.string().min(1).max(300),
});

function stripExt(name: string): string {
  const dot = name.lastIndexOf(".");
  return (dot > 0 ? name.slice(0, dot) : name).trim() || name;
}

export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "validation", issues: parsed.error.issues }, { status: 400 });
  }
  const { id, key, fileName } = parsed.data;

  // Fetch the just-uploaded object to derive duration.
  let duration = 0;
  try {
    const bytes = await getObjectBytes(key);
    const meta = await parseBuffer(Buffer.from(bytes), undefined, { duration: true });
    duration = Math.round(meta.format.duration ?? 0);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "metadata extraction failed: " + (e as Error).message },
      { status: 500 },
    );
  }

  const fileUrl = publicUrl(key);

  if (id) {
    const [existing] = await db.select().from(songs).where(eq(songs.id, id));
    if (!existing) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
    const [row] = await db
      .update(songs)
      .set({
        fileKey: key,
        fileUrl,
        durationSeconds: duration,
        status: "active",
      })
      .where(eq(songs.id, id))
      .returning();
    return NextResponse.json({ ok: true, song: row });
  }

  // Create new row.
  const all = await db.select({ freq: songs.freq, id: songs.id }).from(songs);
  const freq = pickFreeFreq(all.map((r) => r.freq));
  if (!freq) {
    return NextResponse.json({ ok: false, error: "no free FM slot left" }, { status: 409 });
  }
  const [from, to] = DEFAULT_GRADIENTS[all.length % DEFAULT_GRADIENTS.length];
  try {
    const [row] = await db
      .insert(songs)
      .values({
        title: stripExt(fileName).slice(0, 200),
        genre: "Ambient",
        freq,
        bpm: 0,
        durationSeconds: duration,
        gradientFrom: from,
        gradientTo: to,
        pinned: false,
        status: "active",
        fileKey: key,
        fileUrl,
      })
      .returning();
    return NextResponse.json({ ok: true, song: row });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
