import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { songs } from "@/db/schema";
import { SongCreateSchema } from "@/lib/songs";
import { pickRandomGradient } from "@/lib/palettes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(songs).orderBy(desc(songs.id));
  return NextResponse.json({ ok: true, songs: rows });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }
  const parsed = SongCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "validation", issues: parsed.error.issues }, { status: 400 });
  }
  const v = parsed.data;
  try {
    const [from, to] = pickRandomGradient();
    const [row] = await db
      .insert(songs)
      .values({
        title: v.title,
        genre: v.genre,
        freq: v.freq,
        bpm: v.bpm ?? 0,
        durationSeconds: v.durationSeconds ?? 0,
        gradientFrom: from,
        gradientTo: to,
        pinned: v.pinned ?? false,
        status: v.status ?? "draft",
      })
      .returning();
    return NextResponse.json({ ok: true, song: row });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
