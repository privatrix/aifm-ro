"use client";
import { useEffect, useState } from "react";
import { Song, VIO_LINES } from "@/lib/data";
import Oscilloscope from "./Oscilloscope";

interface Props {
  song: Song;
  songs: Song[];
  playing: boolean;
  setPlaying: (p: boolean) => void;
  voted: boolean;
  votes: number;
  onVote: () => void;
  onPrev: () => void;
  onNext: () => void;
  onNote: () => void;
  onOpenLibrary: () => void;
  liveMode: boolean;
  onReturnToLive: () => void;
  upNext: Song | null;
  listenerCount: number | null;
}

const TICK_HEIGHTS = [6,10,7,14,9,18,8,22,12,16,8,20,25,18,12,7,22,16,10,8,20,14,9,18,12,7,16,11,19,8,14,22,10,16];

const LISTENER_POOL: { city: string; initial: string; color: string }[] = [
  { city: "Iași", initial: "A", color: "#E91E8C" },
  { city: "Chișinău", initial: "M", color: "#8E24AA" },
  { city: "București", initial: "I", color: "#1565C0" },
  { city: "Cluj", initial: "R", color: "#F57C00" },
  { city: "Timișoara", initial: "V", color: "#7B1FA2" },
  { city: "Brașov", initial: "E", color: "#00695C" },
  { city: "Sibiu", initial: "M", color: "#AD1457" },
  { city: "Constanța", initial: "L", color: "#5E35B1" },
  { city: "Bălți", initial: "T", color: "#BF360C" },
  { city: "Galați", initial: "D", color: "#1565C0" },
];

function moodEmoji(): string {
  const h = new Date().getHours();
  if (h >= 6 && h < 10) return "☕";
  if (h >= 10 && h < 18) return "☀️";
  if (h >= 18 && h < 22) return "🌆";
  return "🌙";
}

function timeOfDayLabel(): string {
  const h = new Date().getHours();
  if (h >= 6 && h < 10) return "Dimineață";
  if (h >= 10 && h < 18) return "Programul de zi";
  if (h >= 18 && h < 22) return "Programul de seară";
  return "Programul de noapte";
}

export default function RadioView({
  song, songs, playing, setPlaying, voted, votes, onVote, onPrev, onNext, onNote, onOpenLibrary,
  liveMode, onReturnToLive, upNext, listenerCount,
}: Props) {
  const [lineIdx, setLineIdx] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);
  const [visibleListeners, setVisibleListeners] = useState(LISTENER_POOL.slice(0, 5));

  // Update CSS custom properties when song changes — drives the ambient tint
  useEffect(() => {
    requestAnimationFrame(() => {
      document.documentElement.style.setProperty("--accent-from", song.gradient[0]);
      document.documentElement.style.setProperty("--accent-to", song.gradient[1]);
    });
  }, [song.gradient]);

  useEffect(() => {
    const t = setInterval(() => setLineIdx(i => (i + 1) % VIO_LINES.length), 5500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setStatusIdx(i => (i + 1) % 3), 4000);
    return () => clearInterval(t);
  }, []);

  // Drift listeners in/out
  useEffect(() => {
    const t = setInterval(() => {
      setVisibleListeners(prev => {
        const next = [...prev];
        const remove = Math.floor(Math.random() * next.length);
        next.splice(remove, 1);
        let add: typeof LISTENER_POOL[number];
        do {
          add = LISTENER_POOL[Math.floor(Math.random() * LISTENER_POOL.length)];
        } while (next.find(l => l.city === add.city && l.initial === add.initial));
        next.push(add);
        return next;
      });
    }, 6000);
    return () => clearInterval(t);
  }, []);

  // Position the dial proportional to where this song sits in the list.
  const idx = Math.max(0, songs.findIndex(s => s.id === song.id));
  const scanPct = 8 + (idx / Math.max(1, songs.length - 1)) * 84;

  // Up next preview (server-driven if live, else next song in list)
  const previewUpNext = upNext
    ? [upNext]
    : (songs.length > 1
      ? [songs[(idx + 1) % songs.length], songs[(idx + 2) % songs.length]]
      : []);

  const displayedListenerCount = listenerCount ?? 1;
  const statusLines = [
    {
      dot: "bg-red-500",
      text: <>Pe Undă · <span className="font-mono text-white/70">{displayedListenerCount.toLocaleString("ro-RO")}</span></>,
    },
    { dot: "bg-pink-500", text: <>Vio · <span className="text-pink-300">live</span></> },
    {
      dot: "bg-cyan-400",
      text: <span className="truncate max-w-[160px] inline-block align-middle">Acum · {song.title}</span>,
    },
  ];
  const status = statusLines[statusIdx];

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-4 gap-4 overflow-hidden">

      {/* Top status bar */}
      <div className="flex items-center justify-between w-full max-w-[340px]">
        <div key={statusIdx} className="flex items-center gap-2 animate-fade-in">
          <span className={`w-2 h-2 rounded-full ${status.dot} animate-breathe`} />
          <span className="text-white/65 text-[11px] font-sans font-medium tracking-wider uppercase">
            {status.text}
          </span>
        </div>
        <span className="text-white/35 text-[10px] font-mono tracking-wider uppercase">
          {timeOfDayLabel()}
        </span>
      </div>

      {/* Solo-mode banner */}
      {!liveMode && (
        <button
          onClick={onReturnToLive}
          className="w-full max-w-[340px] flex items-center justify-between px-3 py-2 rounded-xl text-[12px] font-sans active:scale-[0.99] transition-transform"
          style={{ background: "rgba(233,30,140,0.10)", border: "1px solid rgba(233,30,140,0.30)", color: "#ffb1cc" }}
        >
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
            Asculți pe cont propriu
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest">↩ pe undă</span>
        </button>
      )}

      {/* Player card */}
      <div className="w-full max-w-[340px] rounded-[28px] overflow-hidden" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.45)" }}>

        {/* Gradient top section */}
        <div
          className="relative"
          style={{ background: `linear-gradient(160deg, ${song.gradient[0]}, ${song.gradient[1]})`, transition: "background 600ms ease" }}
        >
          {/* Card header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-2">
            <button
              onClick={onOpenLibrary}
              className="w-8 h-8 flex items-center justify-center text-white/80 active:scale-90 transition-transform"
              aria-label="Deschide lista"
            >
              <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
                <rect y="0" width="14" height="2.5" rx="1.25" fill="currentColor"/>
                <rect y="5.75" width="20" height="2.5" rx="1.25" fill="currentColor"/>
                <rect y="11.5" width="17" height="2.5" rx="1.25" fill="currentColor"/>
              </svg>
            </button>
            <span className="text-white font-sans font-semibold text-[15px] tracking-[0.2em]">AIFM</span>
            <button
              onClick={() => setPlaying(!playing)}
              className={`w-8 h-8 flex items-center justify-center text-white/80 active:scale-90 transition-transform ${!playing ? "animate-pulse-soft" : ""}`}
              aria-label={playing ? "Pauză" : "Ascultă"}
            >
              {playing ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="2"/>
                  <rect x="14" y="5" width="4" height="14" rx="2"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
          </div>

          {/* Waveform + GENRE in big serif */}
          <div className="relative h-[100px] mx-4">
            <Oscilloscope playing={playing} />
            <div className="absolute inset-0 flex items-center justify-between z-10 px-1">
              <button
                onClick={onPrev}
                className="text-white/75 font-sans font-bold text-[13px] tracking-tight active:scale-90 transition-transform select-none px-1"
                aria-label="Piesa anterioară"
              >
                ◀◀
              </button>
              <div className="text-center leading-none select-none px-2 max-w-[60%]" style={{ textShadow: "0 2px 16px rgba(0,0,0,0.4)" }}>
                <div
                  className="text-white font-serif font-normal truncate"
                  style={{ fontSize: "clamp(20px, 5vw, 28px)", letterSpacing: "0.01em" }}
                >
                  {song.genre}
                </div>
              </div>
              <button
                onClick={onNext}
                className="text-white/75 font-sans font-bold text-[13px] tracking-tight active:scale-90 transition-transform select-none px-1"
                aria-label="Piesa următoare"
              >
                ▶▶
              </button>
            </div>
          </div>

          {/* Song info */}
          <div className="text-center px-5 pt-3 pb-1">
            <div className="text-white font-sans font-bold text-[22px] leading-tight">{song.title}</div>
            <div className="text-white/60 font-sans text-[13px] mt-1">{song.duration}</div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-around px-10 py-4">
            <button className="card-action" onClick={onNext} aria-label="Următor">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18"/>
              </svg>
            </button>
            <button
              className="card-action flex items-center gap-1.5"
              data-active={voted}
              onClick={onVote}
              aria-label="Votează"
              style={{ width: "auto", padding: "0 14px", borderRadius: "999px" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={voted ? "white" : "none"} stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
              <span className="font-sans text-white font-medium text-[13px]">{votes}</span>
            </button>
            <button className="card-action" onClick={onNote} aria-label="Trimite bilet">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Position indicator (no freq numbers) */}
        <div className="px-5 pt-3 pb-4" style={{ background: "#f3eee5" }}>
          <div className="flex items-end gap-[3px] h-7 mb-2">
            {TICK_HEIGHTS.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-full"
                style={{ height: `${h}px`, background: i % 5 === 0 ? "#E91E8C" : "#F48FB1" }}
              />
            ))}
          </div>
          <div className="freq-track mb-1">
            <div className="h-full rounded-full" style={{ width: `${scanPct}%`, background: "rgba(233,30,140,0.4)" }} />
            <div className="freq-thumb" style={{ left: `${scanPct}%` }} />
          </div>
          <div className="flex justify-between font-mono text-[10px] mt-1.5 tracking-wider uppercase" style={{ color: "#9b8f7d" }}>
            <span>{idx + 1} / {songs.length}</span>
            <span>{liveMode ? "PE UNDĂ" : "PE CONT PROPRIU"}</span>
          </div>
        </div>
      </div>

      {/* Up Next */}
      {previewUpNext.length > 0 && (
        <div className="w-full max-w-[340px]">
          <div className="text-[10px] font-mono tracking-widest uppercase text-white/35 mb-1.5 px-1">Urmează</div>
          <div className="flex flex-col gap-1.5">
            {previewUpNext.map(s => (
              <div key={s.id} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: `linear-gradient(135deg, ${s.gradient[0]}, ${s.gradient[1]})` }} />
                <span className="font-sans text-[12.5px] text-white/85 truncate flex-1">{s.title}</span>
                <span className="font-mono text-[10px] text-white/40 shrink-0">{s.genre}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mood + Vio quote + listeners */}
      <div className="w-full max-w-[340px] flex flex-col items-center gap-2">
        <span className="text-[14px] opacity-50 animate-breathe">{moodEmoji()}</span>
        <p key={lineIdx} className="font-serif text-[15px] text-white/65 italic leading-snug text-center px-2 animate-fade-in">
          &ldquo;{VIO_LINES[lineIdx]}&rdquo;
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="flex -space-x-2">
            {visibleListeners.map((l, i) => (
              <div
                key={`${l.city}-${l.initial}-${i}`}
                className="w-6 h-6 rounded-full flex items-center justify-center font-sans font-bold text-[10px] text-white animate-fade-in"
                style={{ background: l.color, boxShadow: "0 0 0 1.5px #1a1820" }}
                title={`${l.initial} din ${l.city}`}
              >
                {l.initial}
              </div>
            ))}
          </div>
          {listenerCount !== null && (
            <span className="text-[10px] font-mono text-white/40 tracking-wider ml-1">
              {listenerCount === 1 ? "1 ascultător" : `${listenerCount} ascultători`} în cabină
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
