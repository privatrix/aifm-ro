import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { songs, playHistory, type Song } from "@/db/schema";

/**
 * DJ scheduler — picks the next song based on weighted scoring.
 * Inputs influence weight; final pick is weighted-random so it's never deterministic boring.
 *
 * Weighting:
 *  - Base: ln(votes + 2)        — popular tracks favored, but logarithmically (not winner-takes-all).
 *  - +30% if track is "new" (uploaded < 7 days).
 *  - -90% if track played in last 5 plays (recency penalty).
 *  - -40% if previous song shared the genre.
 *  - Time-of-day soft bias on genre.
 *  - PINNED tracks force-pick if they haven't played in last 3 plays.
 */
export async function pickNextSong(currentSongId: number | null): Promise<Song | null> {
  const all = await db.select().from(songs).where(eq(songs.status, "active"));
  if (all.length === 0) return null;
  if (all.length === 1) return all[0];

  // Recent history (last 5 plays).
  const recent = await db
    .select()
    .from(playHistory)
    .orderBy(desc(playHistory.startedAt))
    .limit(5);
  const recentIds = new Set(recent.map((r) => r.songId));

  const currentSong = currentSongId ? all.find((s) => s.id === currentSongId) : null;
  const previousGenre = currentSong?.genre ?? null;

  // Pinned takeover.
  const pinned = all.filter((s) => s.pinned && !recentIds.has(s.id));
  if (pinned.length > 0) {
    return pinned[Math.floor(Math.random() * pinned.length)];
  }

  // Time-of-day bias map.
  const hour = new Date().getUTCHours();
  // Romanian time ~ UTC+3 in summer; UTC+2 winter. Using rough bands.
  const isNight = hour >= 19 || hour < 7;     // 22-06 RO summer
  const isMorning = hour >= 4 && hour < 8;    // 07-11 RO
  const isAfternoon = hour >= 8 && hour < 15; // 11-18 RO

  function timeOfDayBoost(genre: string): number {
    const g = genre.toLowerCase();
    if (isNight && (g.includes("ambient") || g.includes("lo-fi") || g.includes("chill"))) return 1.4;
    if (isMorning && (g.includes("ambient") || g.includes("lo-fi"))) return 1.2;
    if (isAfternoon && (g.includes("dance") || g.includes("synthwave") || g.includes("pop") || g.includes("hip-hop") || g.includes("trap"))) return 1.3;
    return 1.0;
  }

  // Score each candidate.
  const candidates = all
    .filter((s) => s.id !== currentSongId) // never repeat the same song
    .map((s) => {
      let weight = Math.log(s.votes + 2);

      // New-track boost.
      const ageDays = (Date.now() - new Date(s.uploadedAt).getTime()) / 86_400_000;
      if (ageDays < 7) weight *= 1.3;

      // Recency penalty.
      if (recentIds.has(s.id)) weight *= 0.1;

      // Genre balance.
      if (previousGenre && s.genre === previousGenre) weight *= 0.6;

      // Time-of-day bias.
      weight *= timeOfDayBoost(s.genre);

      return { song: s, weight };
    });

  // Weighted random pick.
  const total = candidates.reduce((sum, c) => sum + c.weight, 0);
  if (total <= 0) {
    // Fall back to simple random if all weights got zeroed (edge case).
    return candidates[Math.floor(Math.random() * candidates.length)].song;
  }

  let r = Math.random() * total;
  for (const c of candidates) {
    r -= c.weight;
    if (r <= 0) return c.song;
  }
  return candidates[candidates.length - 1].song;
}
