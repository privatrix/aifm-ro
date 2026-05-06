import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import crypto from "crypto";
import { db } from "@/db";
import { songs, voteLog } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fingerprint(req: NextRequest): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const ua = req.headers.get("user-agent") ?? "";
  return crypto.createHash("sha256").update(`${ip}::${ua}`).digest("hex").slice(0, 32);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "bad id" }, { status: 400 });
  }
  const fp = fingerprint(req);

  // Toggle: if a vote already exists, remove it; otherwise add it.
  const existing = await db
    .select()
    .from(voteLog)
    .where(and(eq(voteLog.songId, id), eq(voteLog.fingerprint, fp)));

  if (existing.length > 0) {
    await db.delete(voteLog).where(and(eq(voteLog.songId, id), eq(voteLog.fingerprint, fp)));
    const [row] = await db
      .update(songs)
      .set({ votes: sql`GREATEST(${songs.votes} - 1, 0)` })
      .where(eq(songs.id, id))
      .returning({ votes: songs.votes });
    return NextResponse.json({ ok: true, voted: false, votes: row?.votes ?? 0 });
  }

  await db.insert(voteLog).values({ songId: id, fingerprint: fp });
  const [row] = await db
    .update(songs)
    .set({ votes: sql`${songs.votes} + 1` })
    .where(eq(songs.id, id))
    .returning({ votes: songs.votes });
  return NextResponse.json({ ok: true, voted: true, votes: row?.votes ?? 0 });
}

// Quick GET to check if THIS browser has voted (used by client to seed UI).
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "bad id" }, { status: 400 });
  }
  const fp = fingerprint(req);
  const existing = await db
    .select()
    .from(voteLog)
    .where(and(eq(voteLog.songId, id), eq(voteLog.fingerprint, fp)));
  return NextResponse.json({ ok: true, voted: existing.length > 0 });
}
