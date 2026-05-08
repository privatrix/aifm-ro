/**
 * GET /api/me/notes — list the current user's bilete (sent notes), newest
 * first, including read status and Vio's reply if any.
 */
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { notes } from "@/db/schema";
import { currentUser, unauthorized } from "@/lib/require-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();

  const db = getDb();
  const rows = await db
    .select({
      id: notes.id,
      text: notes.text,
      status: notes.status,
      reply: notes.reply,
      timeLabel: notes.timeLabel,
      createdAt: notes.createdAt,
      readAt: notes.readAt,
      public: notes.public,
    })
    .from(notes)
    .where(eq(notes.userId, user.id))
    .orderBy(desc(notes.createdAt))
    .limit(50);

  return NextResponse.json({ ok: true, notes: rows });
}
