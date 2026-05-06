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
  onOpenLibrary: () => void;
}

// Static tick bars for the frequency slider section
const TICK_HEIGHTS = [6,10,7,14,9,18,8,22,12,16,8,20,25,18,12,7,22,16,10,8,20,14,9,18,12,7,16,11,19,8,14,22,10,16];

export default function RadioView({ song, playing, setPlaying, voted, votes, onVote, onPrev, onNext, onNote, onOpenLibrary }: Props) {
  const [lineIdx, setLineIdx]     = useState(0);
  const [listeners, setListeners] = useState(1247);

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

  const scanPct = 18 + ((song.id - 1) / 19) * 64;

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center px-4 gap-4"
      style={{ background: "#3B1A60" }}
    >
      {/* Live bar at top */}
      <div className="flex items-center justify-between w-full max-w-[340px]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-aifm animate-breathe" />
          <span className="text-white/60 text-[11px] font-sans font-medium tracking-wider uppercase">Pe Undă</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-blink" />
          <span className="text-white/50 text-[11px] font-mono">{listeners.toLocaleString("ro-RO")}</span>
        </div>
      </div>

      {/* ── Player card ── */}
      <div className="w-full max-w-[340px] rounded-[28px] overflow-hidden shadow-2xl" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>

        {/* Gradient top section */}
        <div
          className="relative"
          style={{ background: `linear-gradient(160deg, ${song.gradient[0]}, ${song.gradient[1]})` }}
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
              className="w-8 h-8 flex items-center justify-center text-white/80 active:scale-90 transition-transform"
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

          {/* Waveform + frequency number */}
          <div className="relative h-[100px] mx-4">
            <Oscilloscope playing={playing} />
            {/* Prev / number / Next overlay */}
            <div className="absolute inset-0 flex items-center justify-between z-10 px-1">
              <button
                onClick={onPrev}
                className="text-white/75 font-sans font-bold text-[13px] tracking-tight active:scale-90 transition-transform select-none px-1"
                aria-label="Piesa anterioară"
              >
                ◀◀
              </button>
              <div className="text-center leading-none select-none" style={{ textShadow: "0 2px 16px rgba(0,0,0,0.4)" }}>
                <div className="text-white font-sans font-bold" style={{ fontSize: "clamp(42px,11vw,52px)" }}>
                  {song.freq}
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
          <div className="text-center px-5 pt-4 pb-1">
            <div className="text-white font-sans font-bold text-[22px] leading-tight">{song.title}</div>
            <div className="text-white/60 font-sans text-[13px] mt-1">{song.genre} · {song.duration}</div>
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

        {/* ── White frequency section ── */}
        <div className="bg-white px-5 pt-3 pb-4">
          {/* Tick marks */}
          <div className="flex items-end gap-[3px] h-7 mb-2">
            {TICK_HEIGHTS.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-full"
                style={{ height: `${h}px`, background: i % 5 === 0 ? "#E91E8C" : "#F48FB1" }}
              />
            ))}
          </div>
          {/* Track + thumb */}
          <div className="freq-track mb-2">
            <div className="h-full rounded-full bg-aifm/30" style={{ width: `${scanPct}%` }} />
            <div className="freq-thumb" style={{ left: `${scanPct}%` }} />
          </div>
          {/* Numbers */}
          <div className="flex justify-between font-sans text-[11px] text-gray-400 mt-1">
            <span>90</span><span>95</span><span>100</span><span>105</span><span>110</span>
          </div>
        </div>
      </div>

      {/* Vio quote */}
      <div className="w-full max-w-[340px] text-center px-2">
        <p key={lineIdx} className="font-serif text-[15px] text-white/55 italic leading-snug animate-fade-in">
          &ldquo;{VIO_LINES[lineIdx]}&rdquo;
        </p>
      </div>
    </div>
  );
}
