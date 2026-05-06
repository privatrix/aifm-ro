import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { parseBuffer } from "music-metadata";
import { db } from "@/db";
import { songs } from "@/db/schema";
import { getObjectBytes, publicUrl } from "@/lib/r2";
import { pickFreeFreq } from "@/lib/songs";
import { pickRandomGradient, GENRES } from "@/lib/palettes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  id: z.number().int().positive().optional(),
  key: z.string().min(1).max(500),
  fileName: z.string().min(1).max(300),
  title: z.string().trim().min(1).max(200).optional(),
  genre: z.enum(GENRES as unknown as [string, ...string[]]).optional(),
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
  const { id, key, fileName, title: customTitle, genre: customGenre } = parsed.data;

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
    const updates: Record<string, unknown> = {
      fileKey: key,
      fileUrl,
      durationSeconds: duration,
      status: "active",
    };
    if (customTitle) updates.title = customTitle;
    if (customGenre) updates.genre = customGenre;
    const [row] = await db
      .update(songs)
      .set(updates)
      .where(eq(songs.id, id))
      .returning();
    return NextResponse.json({ ok: true, song: row });
  }

  // Create new row. Retry on freq collision (concurrent uploads can race).
  const [from, to] = pickRandomGradient();
  for (let attempt = 0; attempt < 5; attempt++) {
    const all = await db.select({ freq: songs.freq }).from(songs);
    const freq = pickFreeFreq(all.map((r) => r.freq));
    if (!freq) {
      return NextResponse.json({ ok: false, error: "no free FM slot left" }, { status: 409 });
    }
    try {
      const [row] = await db
        .insert(songs)
        .values({
          title: customTitle ?? stripExt(fileName).slice(0, 200),
          genre: customGenre ?? "Ambient",
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
      const msg = (e as Error).message;
      // If it's a unique-constraint violation on freq, loop and try the next slot.
      if (/duplicate|unique/i.test(msg) && attempt < 4) continue;
      return NextResponse.json({ ok: false, error: msg }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: false, error: "could not allocate freq after retries" }, { status: 500 });
}
