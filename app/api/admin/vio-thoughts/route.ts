import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { vioThoughts } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(vioThoughts).orderBy(desc(vioThoughts.generatedAt)).limit(60);
  return NextResponse.json({ ok: true, thoughts: rows });
}

export async function POST() {
  // Manual trigger
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ ok: false, error: "ANTHROPIC_API_KEY not set" }, { status: 503 });
  }
  const { generateVioThought } = await import("@/lib/vio-llm");
  const result = await generateVioThought();
  return NextResponse.json(result);
}
