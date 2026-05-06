import { NextRequest, NextResponse } from "next/server";
import { generateVioThought } from "@/lib/vio-llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Triggered by Vercel cron every 2 minutes (see vercel.json).
 * Also callable manually with the right token.
 *
 * Vercel sets `Authorization: Bearer <CRON_SECRET>` if CRON_SECRET env var is set.
 */
export async function GET(req: NextRequest) {
  // Allow Vercel cron's internal call or any caller with the cron secret.
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  const fromVercel = req.headers.get("x-vercel-cron") !== null;
  if (cronSecret && !fromVercel && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // If no Anthropic key is configured, succeed silently — static pool keeps working.
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ ok: true, skipped: "no anthropic key" });
  }

  const result = await generateVioThought();
  return NextResponse.json(result);
}

// Allow POST too (admin manual trigger)
export async function POST(req: NextRequest) {
  return GET(req);
}
