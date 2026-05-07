import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { songs } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/stream/playlist.m3u8
 *
 * Returns the song catalogue as an extended M3U playlist. Liquidsoap reads
 * this URL on its own, plays each entry in order, and re-fetches when the
 * playlist mode supports refresh.
 *
 * Why M3U not JSON: Liquidsoap's `playlist` operator natively understands
 * M3U with `#EXTINF` titles, gives us metadata for free, and avoids JSON
 * parsing edge cases in the .liq script.
 */
export async function GET() {
  const rows = await db.select().from(songs).where(eq(songs.id, songs.id));
  const playable = rows.filter(s => !!s.fileUrl);

  const lines: string[] = ["#EXTM3U"];
  for (const s of playable) {
    const dur = s.durationSeconds && s.durationSeconds > 0 ? s.durationSeconds : -1;
    const title = `${s.title}`.replace(/[\n\r]/g, " ").trim();
    lines.push(`#EXTINF:${dur},${title}`);
    lines.push(`${s.fileUrl}`);
  }

  return new NextResponse(lines.join("\n") + "\n", {
    headers: {
      "Content-Type": "application/vnd.apple.mpegurl",
      "Cache-Control": "no-store, no-cache",
      "X-Robots-Tag": "noindex",
    },
  });
}
