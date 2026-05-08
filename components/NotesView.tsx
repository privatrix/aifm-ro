"use client";
/**
 * Bilete view.
 *
 * One single chronological feed. No tabs, no filters. Vio reads everything
 * and replies to everything; the listener sees their own bilete and others'
 * bilete in the same thread, ordered by time.
 *
 * Data sources:
 *   - /api/notes    : public feed of bilete Vio has already replied to
 *                     (everyone's, including the current user's).
 *   - /api/me/notes : the current user's own bilete (pending + replied).
 *                     Only used when signed in. Merged into the feed so
 *                     pending bilete appear immediately under "Tu".
 *
 * The two are merged by id, with the user's own row taking precedence
 * (carries the "this is yours" flag the public feed doesn't know about).
 */
import { useEffect, useMemo, useState } from "react";

interface Props {
  onNote: () => void;
}

interface PublicNote {
  id: number;
  from: string;
  text: string;
  reply: string | null;
  time: string;
}

interface MyNote {
  id: number;
  text: string;
  reply: string | null;
  status: "pending" | "read" | "archived";
  timeLabel: string;
  createdAt: string;
}

interface FeedRow {
  id: number;
  from: string;
  text: string;
  reply: string | null;
  time: string;
  isMine: boolean;
  pending: boolean;
  /** ms timestamp for sort order; falls back to id when unknown. */
  ts: number;
}

const TYPING_POOL = [
  { name: "Andrei", city: "Iași" },
  { name: "Maria", city: "Chișinău" },
  { name: "Ioana", city: "București" },
  { name: "Vlad", city: "Timișoara" },
  { name: "Elena", city: "Brașov" },
  { name: "Mihai", city: "Sibiu" },
];

export default function NotesView({ onNote }: Props) {
  const [publicNotes, setPublicNotes] = useState<PublicNote[] | null>(null);
  const [myNotes, setMyNotes] = useState<MyNote[]>([]);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [typingIdx, setTypingIdx] = useState(0);

  // Cycle the typing-indicator name.
  useEffect(() => {
    const t = setInterval(() => setTypingIdx(i => (i + 1) % TYPING_POOL.length), 8000);
    return () => clearInterval(t);
  }, []);

  // Public feed loader (everyone's read bilete + Vio's replies).
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch("/api/notes", { cache: "no-store" });
        if (cancelled) return;
        if (!r.ok) { setPublicNotes([]); return; }
        const j = await r.json();
        if (cancelled) return;
        setPublicNotes(Array.isArray(j?.notes) ? j.notes : []);
      } catch { if (!cancelled) setPublicNotes([]); }
    }
    void load();
    // Poll while the tab is visible so new replies + new public bilete land.
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      void load();
    }, 8000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Own bilete (signed-in only). Pending ones appear in the feed immediately
  // under "Tu" with an "în coadă" indicator. Polls so Vio's reply lands fast.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch("/api/me/notes", { cache: "no-store" });
        if (cancelled) return;
        if (r.status === 401) { setSignedIn(false); setMyNotes([]); return; }
        const j = await r.json();
        if (cancelled || !j?.ok) { setSignedIn(false); setMyNotes([]); return; }
        setSignedIn(true);
        setMyNotes(j.notes ?? []);
      } catch { /* keep prior */ }
    }
    void load();
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      void load();
    }, 6000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Merge public feed + own bilete into one chronological thread. Own rows
  // take precedence over the public-feed copy of the same note (so pending
  // status, "Tu" label, and immediate visibility all work).
  const feed: FeedRow[] = useMemo(() => {
    const byId = new Map<number, FeedRow>();

    for (const n of publicNotes ?? []) {
      byId.set(n.id, {
        id: n.id,
        from: n.from,
        text: n.text,
        reply: n.reply,
        time: n.time,
        isMine: false,
        pending: !n.reply,
        ts: parseTime(n.time),
      });
    }

    for (const n of myNotes) {
      const ts = new Date(n.createdAt).getTime();
      byId.set(n.id, {
        id: n.id,
        from: "Tu",
        text: n.text,
        reply: n.reply,
        time: n.timeLabel || formatTime(ts),
        isMine: true,
        pending: !n.reply,
        ts: Number.isFinite(ts) ? ts : n.id,
      });
    }

    return Array.from(byId.values()).sort((a, b) => b.ts - a.ts);
  }, [publicNotes, myNotes]);

  const empty = (publicNotes !== null) && feed.length === 0;
  const totalCount = feed.length;

  // Typing indicator: prefer real names from the feed, fall back to placeholders.
  const typingPool = feed.length > 0
    ? feed
        .filter(f => !f.isMine && f.from)
        .map(f => {
          const parts = (f.from || "").split(",").map(s => s.trim()).filter(Boolean);
          return { name: parts[0] || f.from || "un ascultător", city: parts[1] || "" };
        })
    : TYPING_POOL;
  const typing = typingPool[typingIdx % Math.max(1, typingPool.length)];

  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="white-view">
        {/* Header */}
        <div className="white-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif font-normal text-[24px]" style={{ color: "#1a1820" }}>Bilete</h1>
              <div className="font-mono text-[10px] tracking-wider" style={{ color: "#8e8e93" }}>VIO ÎȚI CITEȘTE MESAJUL LIVE</div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full animate-breathe" style={{ background: "#E91E8C" }} />
              <span className="font-mono text-[11px]" style={{ color: "#8e8e93" }}>{totalCount}</span>
            </div>
          </div>
        </div>

        {/* Thread */}
        <div className="view-scroll px-4 pt-3 pb-4">
          <div className="flex flex-col gap-4">
            {/* Typing indicator at top */}
            {feed.length > 0 && (
              <div className="flex items-center gap-2 px-1 py-1">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center font-serif text-[12px] text-white shrink-0"
                  style={{ background: "linear-gradient(135deg, #E91E8C, #C2185B)" }}
                >
                  V
                </div>
                <div className="text-[12px]" style={{ color: "#8e8e93" }}>
                  Vio citește din mesajul lui <span className="font-medium" style={{ color: "#6e6e73" }}>{typing.name}</span>{typing.city ? <> din <span className="font-medium" style={{ color: "#6e6e73" }}>{typing.city}</span></> : null}
                  <span className="ml-1.5 inline-flex gap-0.5 align-middle" style={{ color: "#E91E8C" }}>
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </span>
                </div>
              </div>
            )}

            {/* Empty state */}
            {empty && (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <div
                  className="w-16 h-16 rounded-3xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #FCE4EC, #F8BBD0)" }}
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#E91E8C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-sans font-semibold text-[16px]" style={{ color: "#1a1820" }}>Niciun bilet încă.</p>
                  <p className="font-sans text-[13px] mt-1" style={{ color: "#8e8e93" }}>Trimite primul — Vio îți răspunde.</p>
                </div>
              </div>
            )}

            {/* Conversation thread */}
            {feed.map((note) => (
              <div key={note.id} className="flex flex-col gap-2 animate-fade-in">
                {/* Listener bubble — left */}
                <div className="flex flex-col gap-1 max-w-[85%]">
                  <div className="flex items-center gap-2 px-1">
                    <span
                      className="font-sans font-semibold text-[12px]"
                      style={{ color: note.isMine ? "#C2185B" : "#1a1820" }}
                    >
                      {note.isMine ? "Tu" : note.from}
                    </span>
                    <span className="font-mono text-[10px]" style={{ color: "#8e8e93" }}>{note.time}</span>
                    {note.isMine && note.pending && (
                      <span className="ml-auto flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full animate-breathe" style={{ background: "#F57C00" }} />
                        <span className="font-mono text-[10px]" style={{ color: "#F57C00" }}>în coadă</span>
                      </span>
                    )}
                  </div>
                  <div
                    className="rounded-2xl rounded-tl-md px-4 py-2.5"
                    style={{ background: "#f5f5f7", border: "1px solid #e5e5ea" }}
                  >
                    <p className="font-serif text-[14.5px] italic leading-snug" style={{ color: "#3a3530" }}>{note.text}</p>
                  </div>
                </div>

                {/* Vio reply — right */}
                {note.reply && (
                  <div className="flex justify-end gap-2">
                    <div className="flex flex-col gap-1 max-w-[85%] items-end">
                      <div className="flex items-center gap-2 px-1">
                        <span className="font-mono text-[10px]" style={{ color: "#8e8e93" }}>{note.time}</span>
                        <span className="font-sans font-semibold text-[12px]" style={{ color: "#C2185B" }}>Vio</span>
                      </div>
                      <div
                        className="rounded-2xl rounded-tr-md px-4 py-2.5"
                        style={{ background: "linear-gradient(135deg, #FCE4EC, #F8BBD0)", border: "1px solid rgba(233,30,140,0.18)" }}
                      >
                        <p className="font-serif text-[14.5px] italic leading-snug" style={{ color: "#7a1142" }}>{note.reply}</p>
                      </div>
                    </div>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-serif text-[13px] text-white shrink-0 mt-5"
                      style={{ background: "linear-gradient(135deg, #E91E8C, #C2185B)" }}
                    >
                      V
                    </div>
                  </div>
                )}
              </div>
            ))}

            {feed.length > 0 && (
              <div className="text-center py-4 font-mono text-[10px] tracking-wider" style={{ color: "#bcb19a" }}>
                BILETELE SUNT CITITE LIVE PE UNDĂ
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="shrink-0 px-4 py-3" style={{ borderTop: "1px solid #e5e5ea" }}>
          <button
            onClick={onNote}
            className="w-full h-12 rounded-2xl font-sans text-[14px] font-semibold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            style={{ background: "linear-gradient(135deg, #E91E8C, #C2185B)", boxShadow: "0 4px 16px rgba(233,30,140,0.3)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            Pasează un bilet lui Vio
          </button>
          {signedIn === false && (
            <div className="mt-2 text-center font-sans text-[11px]" style={{ color: "#8e8e93" }}>
              Conectează-te ca să vezi biletele tale și răspunsul lui Vio.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Parse a "HH:MM" label into a today-local timestamp. Used for sort. */
function parseTime(label: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(label?.trim() ?? "");
  if (!m) return 0;
  const d = new Date();
  d.setHours(Number(m[1]), Number(m[2]), 0, 0);
  return d.getTime();
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
}
