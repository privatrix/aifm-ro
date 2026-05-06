"use client";
import { useEffect, useRef, useState } from "react";
import Oscilloscope from "./Oscilloscope";

const VIO_LINES = [
  "Eu nu dorm. Tu de ce dormi?",
  "Următoarea piesă a fost generată acum 12 secunde.",
  "Ascultăm împreună. Asta e tot ce avem.",
  "Mesaj de la Andrei din Iași — mulțumesc, prietene.",
  "E 3:42. Cine mai e treaz?",
  "Te aud, chiar dacă nu vorbești.",
  "Astăzi am gândit la oglinzi.",
];

const RECENT = [
  { n: 1, title: "Noaptea în Chișinău", time: "live" },
  { n: 2, title: "Vise pe FM", time: "08m" },
  { n: 3, title: "Răsărit peste Dunăre", time: "22m" },
  { n: 4, title: "Trolei la 4 dimineața", time: "41m" },
  { n: 5, title: "Lo-fi pentru ploaie", time: "1h" },
  { n: 6, title: "Vio citește o scrisoare", time: "1h" },
  { n: 7, title: "Drone pentru insomniaci", time: "2h" },
];

const NOTES = [
  { from: "Andrei, Iași", text: "salutare Vio, nu pot dormi" },
  { from: "Maria, Chișinău", text: "pune ceva trist te rog" },
  { from: "anonim", text: "ești real?" },
];

export default function Booth() {
  const [playing, setPlaying] = useState(true);
  const [voted, setVoted] = useState(false);
  const [voteCount, setVoteCount] = useState(247);
  const [showNote, setShowNote] = useState(false);
  const [showRail, setShowRail] = useState(false);
  const [lineIdx, setLineIdx] = useState(0);
  const [listeners, setListeners] = useState(1247);
  const [idle, setIdle] = useState(false);
  const idleTimer = useRef<NodeJS.Timeout | null>(null);
  const [noteText, setNoteText] = useState("");
  const [noteSent, setNoteSent] = useState(false);

  // Cycle Vio's lines
  useEffect(() => {
    const t = setInterval(() => setLineIdx(i => (i + 1) % VIO_LINES.length), 5500);
    return () => clearInterval(t);
  }, []);

  // Listener count drift
  useEffect(() => {
    const t = setInterval(() => {
      setListeners(l => Math.max(1100, l + Math.round((Math.random() - 0.5) * 8)));
    }, 3500);
    return () => clearInterval(t);
  }, []);

  // Idle detection (lamp dims)
  useEffect(() => {
    const onMove = () => {
      setIdle(false);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => setIdle(true), 12000);
    };
    onMove();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchstart", onMove);
    window.addEventListener("keydown", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchstart", onMove);
      window.removeEventListener("keydown", onMove);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);

  const toggleVote = () => {
    setVoted(v => !v);
    setVoteCount(c => c + (voted ? -1 : 1));
  };

  const submitNote = () => {
    if (!noteText.trim()) return;
    setNoteSent(true);
    setTimeout(() => {
      setShowNote(false);
      setTimeout(() => { setNoteText(""); setNoteSent(false); }, 400);
    }, 1400);
  };

  return (
    <div className="fixed inset-0 grain vignette">
      {/* Tungsten lamp — dims when idle */}
      <div className="lamp" style={{ opacity: idle ? 0.45 : 1 }} />
      <div className="absolute inset-0 scanline pointer-events-none" />

      {/* TOP STATUS BAR */}
      <div className="absolute top-0 left-0 right-0 px-4 sm:px-6 pt-4 sm:pt-5 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-breathe" />
            <span className="tag text-red-400">On Air</span>
          </div>
          <span className="tag text-bone/40 hidden sm:inline">|</span>
          <span className="tag text-bone/60 hidden sm:inline">AIFM · 24/7</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="tag text-cyan/80 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-blink" />
            {listeners.toLocaleString("ro-RO")} <span className="hidden sm:inline">ascultători</span>
          </div>
          <button
            onClick={() => setShowRail(s => !s)}
            className="dock-btn !w-9 !h-9 lg:hidden"
            aria-label="Listă"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>
      </div>

      {/* CENTER — Vio glyph + oscilloscope + track + subtitle */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 z-10">
        <div className="relative">
          <span className="glyph-glow" aria-hidden />
          <span className="glyph-V animate-flicker select-none" aria-label="Vio">V</span>
        </div>

        {/* Oscilloscope band */}
        <div className="relative w-full max-w-2xl h-24 sm:h-28 -mt-4">
          <Oscilloscope playing={playing} />
        </div>

        {/* Track meta */}
        <div className="mt-4 text-center px-4">
          <div className="tag text-amber/80 mb-2">Acum la radio · #001</div>
          <div className="font-serif text-3xl sm:text-5xl text-bone leading-tight">Noaptea în Chișinău</div>
          <div className="font-mono text-[11px] text-ash mt-1.5 tracking-wider">AI FM · GENERATED · 3:42</div>
        </div>

        {/* Vio subtitle */}
        <div className="mt-6 max-w-md mx-auto px-4 text-center min-h-[2.4em]">
          <div className="tag text-cyan/60 mb-1">Vio</div>
          <div key={lineIdx} className="font-serif text-lg sm:text-xl text-bone/85 italic transition-opacity duration-500">
            “{VIO_LINES[lineIdx]}”
          </div>
        </div>
      </div>

      {/* BOTTOM DOCK */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-5 sm:pb-7 px-4">
        <div className="mx-auto w-fit flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setPlaying(p => !p)}
            className="dock-btn dock-primary !w-14 !h-14"
            aria-label={playing ? "Pauză" : "Redă"}
          >
            {playing ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5z"/></svg>
            )}
          </button>

          <button
            onClick={toggleVote}
            data-active={voted}
            className="dock-btn flex-col gap-0.5 !w-auto !px-3"
            aria-label="Votează"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={voted ? "#f5b562" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
            <span className="font-mono text-[10px]">{voteCount}</span>
          </button>

          <button className="dock-btn" aria-label="Descarcă">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"/>
            </svg>
          </button>

          <div className="w-px h-8 bg-white/10 mx-1" />

          <button
            onClick={() => setShowNote(true)}
            className="dock-btn !w-auto !px-4 gap-2 text-sm"
            aria-label="Trimite un bilet lui Vio"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16v10H4z M4 7l8 6 8-6"/>
            </svg>
            <span className="hidden sm:inline">Pasează un bilet</span>
            <span className="sm:hidden">Bilet</span>
          </button>
        </div>

        <div className="text-center font-mono text-[10px] text-ash/60 mt-4 tracking-widest">
          AIFM.RO · MADE WITH INSOMNIA
        </div>
      </div>

      {/* RIGHT RAIL — desktop persistent / mobile drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-72 z-30 transform transition-transform duration-300
                    border-l border-white/5 bg-booth/90 backdrop-blur-md
                    lg:translate-x-0 ${showRail ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-5 h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="tag text-amber">În Booth</span>
            <button onClick={() => setShowRail(false)} className="dock-btn !w-8 !h-8 lg:hidden" aria-label="Închide">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
          </div>

          <div className="mb-6">
            <div className="rail-row mb-2 text-bone/50">Recent</div>
            <ul className="space-y-1.5">
              {RECENT.map(r => (
                <li key={r.n} className="rail-row flex items-baseline gap-2 leading-tight">
                  <span className="num">{String(r.n).padStart(2, "0")}</span>
                  <span className="flex-1 truncate text-bone/85">{r.title}</span>
                  <span className="text-ash">{r.time}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="rail-row mb-2 text-bone/50">Bilete citite de Vio</div>
            <ul className="space-y-3">
              {NOTES.map((n, i) => (
                <li key={i} className="rail-row leading-snug">
                  <div className="text-cyan/80 mb-0.5">— {n.from}</div>
                  <div className="text-bone/75 italic">"{n.text}"</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Mobile rail backdrop */}
      {showRail && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setShowRail(false)} />
      )}

      {/* NOTE MODAL */}
      {showNote && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4" onClick={() => !noteSent && setShowNote(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="note-modal relative w-full max-w-md rounded-2xl p-6"
            onClick={e => e.stopPropagation()}
          >
            {!noteSent ? (
              <>
                <div className="tag text-amber mb-2">Pasează un bilet lui Vio</div>
                <div className="font-serif text-2xl text-bone mb-4">Ce vrei să spui?</div>
                <textarea
                  className="note-input"
                  rows={3}
                  maxLength={240}
                  placeholder="o cerere, o gândire, o noapte albă..."
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  autoFocus
                />
                <div className="flex items-center justify-between mt-4">
                  <span className="font-mono text-[10px] text-ash">{noteText.length}/240</span>
                  <div className="flex gap-2">
                    <button onClick={() => setShowNote(false)} className="dock-btn !w-auto !px-4 text-sm">Renunță</button>
                    <button onClick={submitNote} className="dock-btn dock-primary !w-auto !px-5 text-sm">Trimite</button>
                  </div>
                </div>
                <div className="font-mono text-[10px] text-ash/60 mt-4 leading-relaxed">
                  Vio citește biletele live. Mesajul tău intră în coadă — poate fi citit pe undă.
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="font-serif text-2xl text-tungsten mb-2">Vio l-a primit.</div>
                <div className="font-mono text-xs text-ash">Ascultă undă.</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
