"use client";
import { useEffect, useRef, useState } from "react";
import { Song, VIO_LINES } from "@/lib/data";
import Oscilloscope from "./Oscilloscope";

interface Props {
  song: Song;
  playing: boolean;
  setPlaying: (p: boolean) => void;
  voted: boolean;
  votes: number;
  onVote: () => void;
  onPrev: () => void;
  onNext: () => void;
  onNote: () => void;
}

export default function RadioView({ song, playing, setPlaying, voted, votes, onVote, onPrev, onNext, onNote }: Props) {
  const [lineIdx, setLineIdx]     = useState(0);
  const [listeners, setListeners] = useState(1247);
  const [idle, setIdle]           = useState(false);
  const idleTimer                 = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const t = setInterval(() => setLineIdx(i => (i + 1) % VIO_LINES.length), 5500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setListeners(l => Math.max(1100, l + Math.round((Math.random() - 0.5) * 8)));
    }, 3500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const wake = () => {
      setIdle(false);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => setIdle(true), 14000);
    };
    wake();
    window.addEventListener("mousemove",  wake);
    window.addEventListener("touchstart", wake);
    window.addEventListener("keydown",    wake);
    return () => {
      window.removeEventListener("mousemove",  wake);
      window.removeEventListener("touchstart", wake);
      window.removeEventListener("keydown",    wake);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);

  const scanBars = Array.from({ length: 34 }).map((_, i) =>
    Math.abs(Math.sin(i * 0.68 + song.id * 0.31) * 14 + Math.sin(i * 1.42) * 6 + 7)
  );
  const scanPct = ((song.id - 1) / 19) * 78 + 10;

  return (
    <div className="absolute inset-0 grain vignette overflow-hidden">
      <div className="lamp" style={{ opacity: idle ? 0.4 : 1 }} />
      <div className="absolute inset-0 scanline pointer-events-none" />

      {/* ── Status bar ── */}
      <div className="absolute top-0 left-0 right-0 px-5 pt-safe flex items-center justify-between z-20" style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-tungsten animate-breathe" />
          <span className="tag text-tungsten/90">Pe Undă</span>
        </div>
        <span className="font-serif text-base tracking-[0.22em] text-white/90">AIFM</span>
        <div className="tag text-cyan/80 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-blink" />
          {listeners.toLocaleString("ro-RO")}
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-5 gap-5"
           style={{ paddingTop: "max(4.5rem, calc(env(safe-area-inset-top) + 3.5rem))", paddingBottom: "7rem" }}>

        {/* Player card */}
        <div
          className="w-full max-w-[340px] rounded-[28px] overflow-hidden shadow-2xl animate-scale-in"
          style={{ background: `linear-gradient(160deg, ${song.gradient[0]}, ${song.gradient[1]})` }}
        >
          {/* Waveform + navigation */}
          <div className="relative h-36">
            <Oscilloscope playing={playing} />

            {/* Prev */}
            <button
              onClick={onPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.2)" }}
              aria-label="Piesa anterioară"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
              </svg>
            </button>

            {/* Song ID overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="text-center">
                <div className="font-mono text-[9px] text-white/45 tracking-[0.35em] uppercase mb-0.5">AI · FM</div>
                <div className="font-serif text-[52px] text-white/85 leading-none" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>
                  {String(song.id).padStart(2, "0")}
                </div>
              </div>
            </div>

            {/* Next */}
            <button
              onClick={onNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.2)" }}
              aria-label="Piesa următoare"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M6 18l8.5-6L6 6v12zm2.5-6zm7-6h2v12h-2z"/>
              </svg>
            </button>
          </div>

          {/* Song info */}
          <div className="px-6 pt-4 pb-2 text-center">
            <div className="font-serif text-[22px] text-white leading-tight">{song.title}</div>
            <div className="font-mono text-[10px] text-white/55 mt-1 tracking-[0.14em] uppercase">
              Vio · {song.genre} · {song.duration}
            </div>
          </div>

          {/* Actions: dismiss, vote, download */}
          <div className="flex items-center justify-around px-8 py-3">
            <button onClick={onNext} className="card-btn" aria-label="Șterge din coadă">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18"/>
              </svg>
            </button>

            <button onClick={onVote} data-active={voted} className="card-btn flex items-center gap-1.5 !w-auto !px-3" aria-label="Votează">
              <svg width="15" height="15" viewBox="0 0 24 24" fill={voted ? "white" : "none"} stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
              <span className="font-mono text-[11px] text-white">{votes}</span>
            </button>

            <button className="card-btn" aria-label="Descarcă">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16"/>
              </svg>
            </button>
          </div>

          {/* Scan bar */}
          <div className="px-5 pb-5 pt-1">
            <div className="flex items-end gap-[2px] h-5 mb-2">
              {scanBars.map((h, i) => (
                <div key={i} className="flex-1 rounded-full" style={{ height: `${h}px`, background: "rgba(255,255,255,0.3)" }} />
              ))}
            </div>
            <div className="relative h-[2px] rounded-full mb-2" style={{ background: "rgba(255,255,255,0.2)" }}>
              <div className="absolute h-full rounded-full" style={{ width: `${scanPct}%`, background: "rgba(255,255,255,0.75)" }} />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow"
                style={{ left: `calc(${scanPct}% - 6px)`, background: "#fff" }}
              />
            </div>
            <div className="flex justify-between font-mono text-[9px] text-white/45 px-0.5">
              <span>90</span><span>95</span><span>100</span><span>105</span><span>110</span>
            </div>
          </div>
        </div>

        {/* Vio quote */}
        <div className="max-w-xs text-center px-2">
          <div className="tag text-cyan/55 mb-1.5">Vio</div>
          <p key={lineIdx} className="font-serif text-base text-white/70 italic leading-snug animate-fade-in">
            &ldquo;{VIO_LINES[lineIdx]}&rdquo;
          </p>
        </div>
      </div>

      {/* ── Bottom dock ── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 px-5"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <button onClick={() => setPlaying(!playing)} className="dock-primary" aria-label={playing ? "Pauză" : "Ascultă"}>
            {playing ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" rx="1.5"/>
                <rect x="14" y="5" width="4" height="14" rx="1.5"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          <button onClick={onNote} className="dock-btn gap-2" style={{ paddingLeft: "18px", paddingRight: "18px" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            <span className="font-sans text-sm">Bilet lui Vio</span>
          </button>
        </div>

        <div className="text-center font-mono text-[9px] tracking-[0.22em] text-white/25">
          AIFM.RO · RADIO AI ROMÂNESC · 24/7
        </div>
      </div>
    </div>
  );
}
