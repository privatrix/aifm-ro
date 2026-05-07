"use client";
import { useEffect, useMemo, useState } from "react";
import { VIO_NOTES as MOCK_NOTES, VioNote } from "@/lib/data";

interface Props {
  onNote: () => void;
}

const TYPING_POOL = [
  { name: "Andrei", city: "Iași" },
  { name: "Maria", city: "Chișinău" },
  { name: "Ioana", city: "București" },
  { name: "Vlad", city: "Timișoara" },
  { name: "Elena", city: "Brașov" },
  { name: "Mihai", city: "Sibiu" },
];

interface MyNote {
  id: string;
  text: string;
  createdAt: number;
}

const STORAGE_KEY = "aifm:my-notes";

function loadMyNotes(): MyNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MyNote[];
  } catch { return []; }
}

export default function NotesView({ onNote }: Props) {
  const [tab, setTab] = useState<"citite" | "coada">("citite");
  const [filter, setFilter] = useState<"toate" | "raspuns" | "fararaspuns">("toate");
  const [typingIdx, setTypingIdx] = useState(0);
  const [myNotes, setMyNotes] = useState<MyNote[]>([]);
  const [serverNotes, setServerNotes] = useState<VioNote[] | null>(null);

  // Fetch real published notes; fall back to mock if API empty/fails.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/notes", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(j => {
        if (cancelled || !j?.ok) return;
        if (Array.isArray(j.notes) && j.notes.length > 0) {
          setServerNotes(j.notes as VioNote[]);
        } else {
          setServerNotes([]);
        }
      })
      .catch(() => setServerNotes([]));
    return () => { cancelled = true; };
  }, []);

  const sourceNotes: VioNote[] = serverNotes && serverNotes.length > 0 ? serverNotes : MOCK_NOTES;

  useEffect(() => {
    setMyNotes(loadMyNotes());
    const onStorage = () => setMyNotes(loadMyNotes());
    window.addEventListener("storage", onStorage);
    // also poll once after a click on Pasează (cheap)
    const t = setInterval(() => setMyNotes(loadMyNotes()), 1500);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTypingIdx(i => (i + 1) % TYPING_POOL.length), 8000);
    return () => clearInterval(t);
  }, []);

  const filteredNotes = useMemo<VioNote[]>(() => {
    if (filter === "toate") return sourceNotes;
    if (filter === "raspuns") return sourceNotes.filter(n => !!n.reply);
    return sourceNotes.filter(n => !n.reply);
  }, [filter, sourceNotes]);

  // Prefer a real note name if we have any, else random fictional pool.
  const typingPool = sourceNotes.length > 0
    ? sourceNotes.map(n => {
        const parts = (n.from || "").split(",").map(s => s.trim()).filter(Boolean);
        return { name: parts[0] || n.from || "un ascultător", city: parts[1] || "" };
      })
    : TYPING_POOL;
  const typing = typingPool[typingIdx % Math.max(1, typingPool.length)];

  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="white-view">

        {/* Header */}
        <div className="white-header">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="font-serif font-normal text-[24px]" style={{ color: "#1a1820" }}>Bilete</h1>
              <div className="font-mono text-[10px] tracking-wider" style={{ color: "#8e8e93" }}>VIO ÎȚI CITEȘTE MESAJUL LIVE</div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full animate-breathe" style={{ background: "#E91E8C" }} />
              <span className="font-mono text-[11px]" style={{ color: "#8e8e93" }}>{sourceNotes.length}</span>
            </div>
          </div>
          {/* Primary tabs */}
          <div className="flex gap-1 p-1 rounded-full w-fit" style={{ background: "#f5f5f7", border: "1px solid #e5e5ea" }}>
            {([["citite", "Citite de Vio"], ["coada", `Coada mea${myNotes.length ? ` · ${myNotes.length}` : ""}`]] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="pill-btn"
                style={{
                  background: tab === id ? "linear-gradient(135deg, #E91E8C, #C2185B)" : "transparent",
                  color: tab === id ? "#fff" : "#6e6e73",
                  height: "30px",
                  padding: "0 14px",
                  fontSize: "12px",
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {/* Secondary filter (only on citite) */}
          {tab === "citite" && (
            <div className="flex gap-1.5 mt-3">
              {([["toate", "Toate"], ["raspuns", "Cu răspuns"], ["fararaspuns", "Fără răspuns"]] as const).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setFilter(id)}
                  className="font-sans text-[11px] px-3 py-1 rounded-full transition-colors"
                  style={{
                    background: filter === id ? "rgba(233,30,140,0.12)" : "transparent",
                    color: filter === id ? "#C2185B" : "#8e8e93",
                    border: filter === id ? "1px solid rgba(233,30,140,0.25)" : "1px solid #e5e5ea",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Thread */}
        <div className="view-scroll px-4 pt-3 pb-4">
          {tab === "citite" ? (
            <div className="flex flex-col gap-4">
              {/* Typing indicator at top */}
              <div className="flex items-center gap-2 px-1 py-1">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center font-serif text-[12px] text-white shrink-0"
                  style={{ background: "linear-gradient(135deg, #E91E8C, #C2185B)" }}
                >
                  V
                </div>
                <div className="text-[12px]" style={{ color: "#8e8e93" }}>
                  Vio citește din mesajul lui <span className="font-medium" style={{ color: "#6e6e73" }}>{typing.name}</span> din <span className="font-medium" style={{ color: "#6e6e73" }}>{typing.city}</span>
                  <span className="ml-1.5 inline-flex gap-0.5 align-middle" style={{ color: "#E91E8C" }}>
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </span>
                </div>
              </div>

              {/* Conversation thread */}
              {filteredNotes.map((note, i) => (
                <div key={i} className="flex flex-col gap-2 animate-fade-in">
                  {/* Listener bubble — left */}
                  <div className="flex flex-col gap-1 max-w-[80%]">
                    <div className="flex items-center gap-2 px-1">
                      <span className="font-sans font-semibold text-[12px]" style={{ color: "#1a1820" }}>{note.from}</span>
                      <span className="font-mono text-[10px]" style={{ color: "#8e8e93" }}>{note.time}</span>
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
                      <div className="flex flex-col gap-1 max-w-[80%] items-end">
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
              {filteredNotes.length === 0 && (
                <div className="text-center py-10 font-sans text-[13px]" style={{ color: "#8e8e93" }}>
                  Niciun mesaj cu acest filtru.
                </div>
              )}
              <div className="text-center py-4 font-mono text-[10px] tracking-wider" style={{ color: "#bcb19a" }}>
                BILETELE SUNT CITITE LIVE PE UNDĂ
              </div>
            </div>
          ) : (
            // Coada mea
            <div className="flex flex-col gap-3">
              {myNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                  <div
                    className="w-16 h-16 rounded-3xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #FCE4EC, #F8BBD0)" }}
                  >
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#E91E8C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-sans font-semibold text-[16px]" style={{ color: "#1a1820" }}>Niciun bilet trimis.</p>
                    <p className="font-sans text-[13px]" style={{ color: "#8e8e93" }}>Trimite primul bilet lui Vio.</p>
                  </div>
                </div>
              ) : (
                myNotes.map(n => (
                  <div key={n.id} className="flex flex-col gap-1 max-w-[85%] animate-fade-in">
                    <div className="flex items-center gap-2 px-1">
                      <span className="font-sans font-semibold text-[12px]" style={{ color: "#1a1820" }}>Tu</span>
                      <span className="font-mono text-[10px]" style={{ color: "#8e8e93" }}>
                        {new Date(n.createdAt).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="ml-auto flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: "#F57C00" }} />
                        <span className="font-mono text-[10px]" style={{ color: "#F57C00" }}>în coadă</span>
                      </span>
                    </div>
                    <div
                      className="rounded-2xl rounded-tl-md px-4 py-2.5"
                      style={{ background: "#f5f5f7", border: "1px solid #e5e5ea" }}
                    >
                      <p className="font-serif text-[14.5px] italic leading-snug" style={{ color: "#3a3530" }}>{n.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
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
        </div>
      </div>
    </div>
  );
}
