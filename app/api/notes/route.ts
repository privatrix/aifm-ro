import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { db } from "@/db";
import { notes } from "@/db/schema";
import { currentUser } from "@/lib/require-user";
import { processPendingNotes } from "@/lib/vio-llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  text: z.string().trim().min(1).max(240),
  fromName: z.string().trim().min(1).max(100).optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }
  const { text, fromName } = parsed.data;
  // If the request comes with a session cookie, bind the note to the user
  // and use their displayName instead of any fromName they typed (the UI
  // shouldn't even ask for one in that case, but we defend in depth).
  const user = await currentUser();
  const [row] = await db
    .insert(notes)
    .values({
      fromName: user?.displayName ?? fromName ?? "anonim",
      text,
      status: "pending",
      timeLabel: new Date().toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" }),
      userId: user?.id ?? null,
      // Bilete are read on air by default. The radio concept is that Vio
      // reads listeners' postcards live; making them public matches the show.
      public: true,
    })
    .returning();

  // Kick the LLM processor right after insert so the user doesn't have to wait
  // for the next cron tick (up to 2 minutes). We don't await it — fire and
  // forget. Vercel keeps the function warm long enough for it to finish.
  // The processor itself is idempotent (only acts on status='pending'), so a
  // racing cron tick won't double-reply.
  if (process.env.ANTHROPIC_API_KEY) {
    void processPendingNotes(3).catch(() => { /* swallow; cron retries */ });
  }

  return NextResponse.json({ ok: true, note: { id: row.id } });
}

// Public-readable note thread: notes Vio has read AND that are flagged
// public. New bilete default to public=true on insert (the radio concept is
// that Vio reads listeners' postcards live). Admin can flip the flag.
export async function GET() {
  const rows = await db
    .select()
    .from(notes)
    .where(and(eq(notes.status, "read"), eq(notes.public, true)))
    .orderBy(desc(notes.createdAt))
    .limit(40);
  return NextResponse.json({
    ok: true,
    notes: rows.map((r) => ({
      id: r.id,
      from: r.fromName,
      text: r.text,
      reply: r.reply,
      time: r.timeLabel,
    })),
  });
}
