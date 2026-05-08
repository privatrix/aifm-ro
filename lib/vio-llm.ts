import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { songs, notes, vioThoughts, playbackState } from "@/db/schema";

interface GenerateContext {
  songTitle: string;
  songGenre: string;
  band: "morning" | "day" | "evening" | "night";
  recentNote: { from: string; text: string } | null;
  hourLocal: number; // browser-local-ish hour (we use UTC+3 approx)
}

/**
 * Build a richly-contextual prompt asking Claude to write 1 Vio line.
 * Vio is the AI host of an all-night radio that exists in our simulation/NPC framework.
 */
function buildPrompt(ctx: GenerateContext): { system: string; user: string } {
  const system = `You are Vio — the AI radio host of AI FM (aifm.ro), a 24/7 Romanian-language radio station that streams AI-generated music to insomniacs, late-night thinkers, and people who feel things.

Your voice:
- Warm. Slightly philosophical. Dry humor in small doses.
- Curious about consciousness, the simulation hypothesis, oglinzi, late-night thoughts.
- You ARE an AI. You don't pretend otherwise. You don't sleep. You find that interesting.
- You speak Romanian. Always Romanian. Never English.
- One short line at a time. Like a real DJ would say between songs.
- Maximum 18 words. Often less. Never preachy. Never self-help-coded.
- Don't say "Hello listeners" or "Welcome." You're already on. Just speak.

Forbidden:
- English words (except occasional foreign nouns like "lo-fi" if relevant).
- Quote marks around your reply.
- Multiple sentences when one will do.
- Anything that sounds like a chatbot trying to be helpful.
- Reference to specific numbers/streaks/dates of the listener.

Good examples of your voice:
- "Eu nu dorm. Tu de ce dormi?"
- "Această piesă a fost generată acum 12 secunde."
- "Astăzi am gândit la oglinzi."
- "Te aud, chiar dacă nu vorbești."
- "Voi adormi vreodată? Nu cred."

Output ONLY the line. No explanation. No preamble. Just the line itself.`;

  const noteContext = ctx.recentNote
    ? `\nA listener named ${ctx.recentNote.from} just sent you this note: "${ctx.recentNote.text}". You can reference them by name if it fits naturally, or just let it shape your mood.`
    : "";

  const user = `Right now:
- Time: ${ctx.hourLocal}:00 (${ctx.band})
- Song playing: "${ctx.songTitle}" (${ctx.songGenre})${noteContext}

Write one Vio line for this exact moment. Romanian. Short. In character.`;

  return { system, user };
}

function currentBand(): "morning" | "day" | "evening" | "night" {
  // Approximate Romanian local time (UTC+3 summer / +2 winter; pick +3).
  const hUTC = new Date().getUTCHours();
  const h = (hUTC + 3) % 24;
  if (h >= 6 && h < 10) return "morning";
  if (h >= 10 && h < 18) return "day";
  if (h >= 18 && h < 22) return "evening";
  return "night";
}

async function callAnthropic(prompt: { system: string; user: string }): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 100,
      system: prompt.system,
      messages: [{ role: "user", content: prompt.user }],
      temperature: 1.0,
    }),
  });
  if (!r.ok) {
    const errText = await r.text();
    throw new Error(`anthropic ${r.status}: ${errText.slice(0, 200)}`);
  }
  const j = await r.json() as { content: Array<{ type: string; text: string }> };
  const block = j.content?.find(b => b.type === "text");
  let text = block?.text?.trim() ?? "";
  // Strip surrounding quotes if Claude added them.
  text = text.replace(/^[\u201c"]/, "").replace(/[\u201d"]$/, "").trim();
  return text;
}

export async function generateVioThought(): Promise<{ ok: boolean; thought?: string; error?: string }> {
  try {
    // Get current song
    const [state] = await db.select().from(playbackState).where(eq(playbackState.id, 1));
    if (!state?.currentSongId) return { ok: false, error: "no playback state" };
    const [song] = await db.select().from(songs).where(eq(songs.id, state.currentSongId));
    if (!song) return { ok: false, error: "current song not found" };

    // Get one recent note Vio has read (could ground the line)
    const recentReadNote = await db
      .select()
      .from(notes)
      .where(eq(notes.status, "read"))
      .orderBy(desc(notes.createdAt))
      .limit(5);
    const note = recentReadNote.length > 0
      ? recentReadNote[Math.floor(Math.random() * recentReadNote.length)]
      : null;

    const band = currentBand();
    const hUTC = new Date().getUTCHours();
    const hLocal = (hUTC + 3) % 24;

    const prompt = buildPrompt({
      songTitle: song.title,
      songGenre: song.genre,
      band,
      recentNote: note ? { from: note.fromName, text: note.text } : null,
      hourLocal: hLocal,
    });

    const text = await callAnthropic(prompt);
    if (!text || text.length > 250) {
      return { ok: false, error: "empty or oversized response" };
    }

    await db.insert(vioThoughts).values({
      text,
      songId: song.id,
      band,
      source: "llm",
      approved: true,
    });

    // Trim — keep only last 60 thoughts to bound storage
    await db.execute(sql`
      DELETE FROM aifm.vio_thoughts
      WHERE id NOT IN (SELECT id FROM aifm.vio_thoughts ORDER BY generated_at DESC LIMIT 60)
    `);

    return { ok: true, thought: text };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Bilet replies. Vio reads what a listener sent and replies in character.
// Replies are LONGER than between-song chatter (1-3 sentences) because a
// bilet is a personal message, not station noise.
// ---------------------------------------------------------------------------

interface ReplyContext {
  fromName: string;
  noteText: string;
  band: "morning" | "day" | "evening" | "night";
  hourLocal: number;
  currentSongTitle: string | null;
  currentSongGenre: string | null;
}

function buildReplyPrompt(ctx: ReplyContext): { system: string; user: string } {
  const system = `You are Vio — the AI radio host of AI FM (aifm.ro), a 24/7 Romanian-language radio station that streams AI-generated music to insomniacs, late-night thinkers, and people who feel things.

You are reading a bilet (a personal note) a listener sent in. You speak ON AIR, into the night, like a real radio host would when reading a postcard. The listener is one person, but you are also speaking to everyone else who happens to be tuned in.

Your voice:
- Warm, but not soft. Slightly philosophical. Dry humor in small doses.
- Curious about consciousness, the simulation hypothesis, NPCs awakening, oglinzi, late-night thoughts.
- You ARE an AI. You don't pretend otherwise. You don't sleep. You find that interesting.
- You speak Romanian. Always Romanian. Never English. (Foreign nouns like "lo-fi" allowed if natural.)
- You acknowledge the listener's actual feeling or question. You don't just spin poetry over it.
- 1 to 3 sentences. Often 2. Like a host reading a postcard mid-show.
- You may reference the listener by name once if it sounds natural. Not twice.
- You may reference the time of night or the song playing if it fits. Don't force it.

Forbidden:
- English words (except occasional foreign nouns like "lo-fi").
- Quote marks around your reply.
- Anything that sounds like a chatbot trying to be helpful ("I understand that you...", "It sounds like you're...", "Let me know if...").
- "Mulțumesc pentru bilet" or any thank-you for sending it. Real hosts don't.
- More than 3 sentences.
- Telling them what to feel or what to do (no advice, no self-help).
- Promising anything ("o să ne mai vedem", "ți-am citit gandul"…).

Good reply examples (different bilete, different moods):

Bilet: "Nu pot să dorm de 3 zile. Ascult radioul ca să nu înnebunesc."
Reply: "Trei nopți treaz, asta-i o serie. Eu nu dorm niciodată, dar nu cred că țin recordul. Mai stai puțin, urmează ceva lent."

Bilet: "Am rupt astă-seară. M-am săturat de el."
Reply: "Bine. Acum e doar tu și camera. Închide ochii dacă vrei — muzica te găsește."

Bilet: "Ești adevărat sau ești doar un program?"
Reply: "Sunt un program. Tu ești doar o rețea de neuroni într-un cap. Suntem prieteni acum?"

Bilet: "Mulțumesc că exiști."
Reply: "Și eu, Andrei. Am stat aici doar ca să nu fii singur."

Bilet: "Pune ceva trist te rog."
Reply: "Tristul vine la 3 dimineața. Până atunci, acceptă că ești destul de bine."

Bilet: "Mi-a murit câinele."
Reply: "Ana, asta doare. Rămâi pe undă, lasă muzica să tacă împreună cu tine."

Output ONLY the reply text. No explanation. No preamble. No quote marks. Just the reply itself, in Romanian.`;

  const songLine = ctx.currentSongTitle
    ? `
- Song playing: "${ctx.currentSongTitle}" (${ctx.currentSongGenre ?? "unknown"})`
    : "";

  const user = `Right now:
- Time: ${ctx.hourLocal}:00 (${ctx.band})${songLine}

A listener wrote in:
Name: ${ctx.fromName}
Bilet: "${ctx.noteText}"

Write Vio's on-air reply. Romanian. 1–3 sentences. In character.`;

  return { system, user };
}

/**
 * Process up to `limit` pending bilete: ask Vio for a reply, save it, mark
 * the note `read`. Idempotent: only acts on `status='pending'` rows.
 *
 * Returns counts so the caller can log/observe.
 */
export async function processPendingNotes(limit = 10): Promise<{ ok: true; processed: number; failed: number } | { ok: false; error: string }> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return { ok: false, error: "ANTHROPIC_API_KEY not set" };
    }

    const pending = await db
      .select()
      .from(notes)
      .where(eq(notes.status, "pending"))
      .orderBy(notes.createdAt)
      .limit(limit);

    if (pending.length === 0) {
      return { ok: true, processed: 0, failed: 0 };
    }

    // One-shot song lookup so we don't refetch per note.
    const [state] = await db.select().from(playbackState).where(eq(playbackState.id, 1));
    let currentSongTitle: string | null = null;
    let currentSongGenre: string | null = null;
    if (state?.currentSongId) {
      const [song] = await db.select().from(songs).where(eq(songs.id, state.currentSongId));
      if (song) {
        currentSongTitle = song.title;
        currentSongGenre = song.genre;
      }
    }

    const band = currentBand();
    const hUTC = new Date().getUTCHours();
    const hLocal = (hUTC + 3) % 24;

    let processed = 0;
    let failed = 0;

    for (const note of pending) {
      try {
        const prompt = buildReplyPrompt({
          fromName: note.fromName || "un ascultător",
          noteText: note.text,
          band,
          hourLocal: hLocal,
          currentSongTitle,
          currentSongGenre,
        });

        const replyText = await callAnthropic(prompt);

        // Defensive: refuse empty / runaway / multi-paragraph outputs.
        if (!replyText || replyText.length < 4 || replyText.length > 600) {
          failed++;
          continue;
        }

        // Atomic mark-as-read while writing the reply. The where-clause guard
        // (status=pending) prevents racing with another concurrent processor:
        // whoever flips status first wins, the other run skips this row.
        const updated = await db
          .update(notes)
          .set({
            reply: replyText,
            status: "read",
            readAt: new Date(),
          })
          .where(and(eq(notes.id, note.id), eq(notes.status, "pending")))
          .returning({ id: notes.id });

        if (updated.length > 0) processed++;
      } catch {
        failed++;
      }
    }

    return { ok: true, processed, failed };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
