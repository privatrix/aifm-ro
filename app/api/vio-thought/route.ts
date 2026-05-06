import { NextResponse } from "next/server";
import { desc, eq, and } from "drizzle-orm";
import { db } from "@/db";
import { vioThoughts } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Returns the most recent approved Vio thought.
 * The public app uses this to overlay the LLM's actual on-air line on top of the static pool.
 */
export async function GET() {
  const [latest] = await db
    .select()
    .from(vioThoughts)
    .where(eq(vioThoughts.approved, true))
    .orderBy(desc(vioThoughts.generatedAt))
    .limit(1);

  if (!latest) return NextResponse.json({ ok: true, thought: null });

  // Stale check: if older than 5 minutes, treat as null (let static pool take over).
  const ageSec = (Date.now() - new Date(latest.generatedAt).getTime()) / 1000;
  if (ageSec > 300) return NextResponse.json({ ok: true, thought: null, stale: true });

  return NextResponse.json({
    ok: true,
    thought: {
      id: latest.id,
      text: latest.text,
      ageSec: Math.floor(ageSec),
    },
  });
}
