import { NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { songs } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  // Only active songs are returned to the public app, ordered by FM frequency.
  const rows = await db
    .select()
    .from(songs)
    .where(eq(songs.status, "active"))
    .orderBy(asc(songs.freq));

  // Shape rows into the same Song type lib/data.ts uses, so the public app can
  // swap source seamlessly.
  const shaped = rows.map((r) => ({
    id: r.id,
    title: r.title,
    genre: r.genre,
    duration: secondsToClock(r.durationSeconds || 0),
    votes: r.votes,
    gradient: [r.gradientFrom, r.gradientTo] as [string, string],
    bpm: r.bpm,
    freq: r.freq,
    fileUrl: r.fileUrl,
  }));

  return NextResponse.json({ ok: true, songs: shaped });
}

function secondsToClock(s: number): string {
  if (!s || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}
