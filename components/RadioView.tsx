"use client";
import { useEffect } from "react";
import { Song } from "@/lib/data";
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

export default function RadioView({
  song, songs, playing, setPlaying, voted, votes, onVote, onPrev, onNext, onNote, onOpenLibrary,
  liveMode, onReturnToLive,
}: Props) {

  // Update CSS custom properties when song changes — drives the ambient tint
  useEffect(() => {
    requestAnimationFrame(() => {
      document.documentElement.style.setProperty("--accent-from", song.gradient[0]);
      document.documentElement.style.setProperty("--accent-to", song.gradient[1]);
    });
  }, [song.gradient]);

  // Position the dial proportional to where this song sits in the list.
  const idx = Math.max(0, songs.findIndex(s => s.id === song.id));
  const scanPct = 8 + (idx / Math.max(1, songs.length - 1)) * 84;

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Big gradient top */}
      <div
        className="flex-1 min-h-0 relative flex flex-col"
        style={{
          background: `linear-gradient(160deg, ${song.gradient[0]}, ${song.gradient[1]})`,
          transition: "background 600ms ease",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <button
            onClick={onOpenLibrary}
            className="w-9 h-9 flex items-center justify-center text-white/85 active:scale-90 transition-transform"
            aria-label="Deschide lista"
          >
            <svg width="22" height="16" viewBox="0 0 20 14" fill="none">
              <rect y="0" width="14" height="2.5" rx="1.25" fill="currentColor"/>
              <rect y="5.75" width="20" height="2.5" rx="1.25" fill="currentColor"/>
              <rect y="11.5" width="17" height="2.5" rx="1.25" fill="currentColor"/>
            </svg>
          </button>
          <span className="text-white font-sans font-semibold text-[15px] tracking-[0.2em]">AIFM</span>
          <span className="w-9 h-9" aria-hidden="true" />
        </div>

        {/* Solo-mode pill (only when off-air) */}
        {!liveMode && (
          <div className="px-6 mt-2">
            <button
              onClick={onReturnToLive}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12px] font-sans active:scale-[0.99] transition-transform"
              style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.20)", color: "#fff" }}
            >
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                pe cont propriu
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest opacity-80">↩ pe undă</span>
            </button>
          </div>
        )}

        {/* Center: waveform + title */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-3 min-h-0">
          {/* Genre pill — small, above the waveform */}
          <div
            className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/70 px-3 py-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}
          >
            {song.genre}
          </div>

          {/* Waveform */}
          <div className="relative w-full max-w-[340px] h-[110px]">
            <Oscilloscope playing={playing} />
          </div>

          {/* Title */}
          <div className="text-center leading-tight">
            <div className="text-white font-sans font-bold text-[26px]">{song.title}</div>
            <div className="text-white/65 font-sans text-[13px] mt-1">{song.duration}</div>
          </div>

          {/* Transport: prev / play / next */}
          <div className="mt-2 flex items-center justify-center gap-7">
            <button
              onClick={onPrev}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform"
              style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.20)" }}
              aria-label="Piesa anterioară"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zM20 6l-10 6 10 6V6z"/>
              </svg>
            </button>

            <button
              onClick={() => setPlaying(!playing)}
              className={`w-[72px] h-[72px] rounded-full flex items-center justify-center text-white active:scale-90 transition-transform ${!playing ? "animate-pulse-soft" : ""}`}
              style={{ background: "rgba(255,255,255,0.20)", border: "1px solid rgba(255,255,255,0.32)", backdropFilter: "blur(6px)" }}
              aria-label={playing ? "Pauză" : "Ascultă"}
            >
              {playing ? (
                <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="2"/>
                  <rect x="14" y="5" width="4" height="14" rx="2"/>
                </svg>
              ) : (
                <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 3 }}>
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>

            <button
              onClick={onNext}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform"
              style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.20)" }}
              aria-label="Piesa următoare"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 6h2v12h-2zM4 6l10 6-10 6V6z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Action buttons row */}
        <div className="flex items-center justify-around px-12 pb-6">
          <button
            className="card-action"
            onClick={async () => {
              const url = typeof window !== "undefined" ? window.location.href : "";
              const data = { title: "AIFM", text: `Ascult „${song.title}” pe AIFM`, url };
              try {
                if (typeof navigator !== "undefined" && "share" in navigator) {
                  await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share(data);
                  return;
                }
              } catch { /* user cancelled or share failed — fall through */ }
              try {
                if (typeof navigator !== "undefined" && navigator.clipboard) {
                  await navigator.clipboard.writeText(url);
                }
              } catch {}
            }}
            aria-label="Distribuie"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/>
              <circle cx="6" cy="12" r="3"/>
              <circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
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

      {/* White bottom: position scale */}
      <div className="px-6 pt-4 pb-5" style={{ background: "#ffffff" }}>
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
  );
}
