import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { songs, notes, playHistory, voteLog } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [s] = await db.select({ n: sql<number>`count(*)::int` }).from(songs);
    const [n] = await db.select({ n: sql<number>`count(*)::int` }).from(notes);
    const [p] = await db.select({ n: sql<number>`count(*)::int` }).from(playHistory);
    const [v] = await db.select({ n: sql<number>`count(*)::int` }).from(voteLog);
    return NextResponse.json({
      ok: true,
      counts: { songs: s.n, notes: n.n, playHistory: p.n, voteLog: v.n },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
