import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { notes } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(notes).orderBy(desc(notes.createdAt)).limit(200);
  return NextResponse.json({ ok: true, notes: rows });
}
