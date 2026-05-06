"use client";
import { useState } from "react";
import Equalizer from "./Equalizer";

const FAKE_TRACK = {
  title: "Noaptea în Chișinău",
  artist: "Generated · AI FM",
  votes: 247,
  duration: "3:42",
};

export default function Player() {
  const [playing, setPlaying] = useState(true);
  const [voted, setVoted] = useState(false);

  return (
    <div className="glass shadow-soft rounded-3xl p-5 sm:p-6 w-full max-w-xl mx-auto">
      <div className="flex items-center gap-4">
        {/* Album art / live indicator */}
        <div className="relative shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-ember to-glow flex items-center justify-center text-ink font-display text-3xl shadow-soft">
            FM
          </div>
          <span className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-semibold tracking-wider animate-breathe">
            LIVE
          </span>
        </div>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-[0.2em] text-glow/80 mb-1">Acum la radio</div>
          <div className="font-display text-xl sm:text-2xl truncate">{FAKE_TRACK.title}</div>
          <div className="text-bone/60 text-sm truncate">{FAKE_TRACK.artist} <span className="divider-dot" />{FAKE_TRACK.duration}</div>
        </div>

        {/* Equalizer */}
        <div className="hidden sm:block">
          <Equalizer playing={playing} />
        </div>
      </div>

      {/* Controls */}
      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={() => setPlaying(p => !p)}
          aria-label={playing ? "Pauză" : "Redă"}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          {playing ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
              Pauză
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5z"/></svg>
              Redă
            </>
          )}
        </button>

        <button
          onClick={() => setVoted(v => !v)}
          className={`btn-ghost flex items-center gap-2 text-sm transition ${voted ? "!bg-ember/20 !border-ember/50" : ""}`}
          aria-pressed={voted}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={voted ? "#ff6b35" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
          </svg>
          {FAKE_TRACK.votes + (voted ? 1 : 0)}
        </button>

        <button className="btn-ghost flex items-center gap-2 text-sm" aria-label="Descarcă">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"/>
          </svg>
          <span className="hidden sm:inline">Descarcă</span>
        </button>

        <div className="ml-auto text-bone/50 text-xs hidden sm:block">
          1,284 ascultători
        </div>
      </div>

      {/* Audio element placeholder for future stream */}
      {/* <audio id="stream" src="https://stream.aifm.ro/live" preload="none" /> */}
    </div>
  );
}
