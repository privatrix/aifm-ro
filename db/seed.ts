import { sql } from "drizzle-orm";
import { db } from "./index";
import { songs } from "./schema";
import { SONGS } from "@/lib/data";

function durationToSeconds(d: string): number {
  const [m, s] = d.split(":").map(Number);
  return (m || 0) * 60 + (s || 0);
}

/** Idempotent: only seeds if `aifm.songs` is empty. */
export async function seedSongsIfEmpty(): Promise<{ inserted: number; skipped: boolean }> {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(songs);
  if (n > 0) return { inserted: 0, skipped: true };

  const rows = SONGS.map((s) => ({
    title: s.title,
    genre: s.genre,
    freq: s.freq,
    bpm: s.bpm,
    durationSeconds: durationToSeconds(s.duration),
    gradientFrom: s.gradient[0],
    gradientTo: s.gradient[1],
    votes: s.votes,
    status: "draft" as const,
    pinned: false,
  }));

  await db.insert(songs).values(rows);
  return { inserted: rows.length, skipped: false };
}
