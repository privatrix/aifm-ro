/**
 * GET /api/cron/vio-reply
 *
 * Periodic processor for pending bilete: picks up to 10 notes with
 * status='pending', asks Vio (Claude) for a reply, saves it, marks them
 * read. Designed to be wired into Vercel cron (vercel.json) every couple
 * minutes alongside vio-think.
 *
 * Auth model matches /api/cron/vio-think:
 *   - Internal Vercel cron requests carry x-vercel-cron and pass.
 *   - External callers must present `Authorization: Bearer <CRON_SECRET>`.
 *   - In dev (no CRON_SECRET set) the route is open so it can be triggered
 *     manually.
 */
import { NextRequest, NextResponse } from "next/server";
import { processPendingNotes } from "@/lib/vio-llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Replies are LLM calls; allow up to 60s for a small batch.
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  const fromVercel = req.headers.get("x-vercel-cron") !== null;
  if (cronSecret && !fromVercel && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ ok: true, skipped: "no anthropic key" });
  }

  // Cap at 10 notes per invocation to stay under maxDuration even when each
  // LLM round-trip drifts toward 5s. The next cron tick picks up the rest.
  const result = await processPendingNotes(10);
  return NextResponse.json(result);
}

// Manual admin trigger.
export async function POST(req: NextRequest) {
  return GET(req);
}
