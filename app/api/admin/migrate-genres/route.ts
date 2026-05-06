import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { songs } from "@/db/schema";
import { GENRE_MIGRATION_MAP, GENRES } from "@/lib/palettes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const allGenres = new Set<string>(GENRES);
  const rows = await db.select().from(songs);
  let updated = 0;
  for (const r of rows) {
    if (allGenres.has(r.genre)) continue; // already canonical
    const mapped = GENRE_MIGRATION_MAP[r.genre] ?? "Ambient";
    await db.update(songs).set({ genre: mapped }).where(eq(songs.id, r.id));
    updated++;
  }
  return NextResponse.json({ ok: true, updated, total: rows.length });
}
