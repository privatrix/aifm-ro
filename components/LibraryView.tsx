"use client";
import { useState } from "react";
import { Song } from "@/lib/data";

interface Props {
  songs: Song[];
  voted: Set<number>;
  votes: Record<number, number>;
  onVote: (id: number) => void;
  currentSong: Song;
  onPlay: (idx: number) => void;
  onBack: () => void;
}

export default function LibraryView({ songs, voted, votes, onVote, currentSong, onPlay, onBack }: Props) {
  const [expanded, setExpanded] = useState<number | null>(currentSong.id);
  const [query, setQuery]       = useState("");

  const visible = songs.filter(s =>
    s.title.toLowerCase().includes(query.toLowerCase()) ||
    s.genre.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="absolute inset-0 flex flex-col pt-3">
      <div className="white-view">

        {/* Header */}
        <div className="white-header">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={onBack}
              className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: "#FCE4EC", color: "#C2185B" }}
              aria-label="Înapoi"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="2.2" strokeLinecap="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </button>
            <h1 className="font-serif font-normal text-[24px] flex-1" style={{ color: "#1a1820" }}>Bibliotecă</h1>
            <span className="font-mono text-[11px]" style={{ color: "#8e8e93" }}>{songs.length} piese</span>
          </div>
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="search"
              placeholder="Caută piese sau gen..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl font-sans text-[14px] outline-none"
              style={{ background: "#f5f5f7", border: "1px solid #e5e5ea", color: "#1a1820" }}
            />
          </div>
        </div>

        {/* Station list */}
        <div className="view-scroll">
          {visible.length === 0 && (
            <div className="text-center py-16 font-sans text-[14px]" style={{ color: "#8e8e93" }}>Nicio piesă găsită.</div>
          )}

          {visible.map((song, visIdx) => {
            const globalIdx = songs.findIndex(s => s.id === song.id);
            const isExp     = expanded === song.id;
            const isPlaying = currentSong.id === song.id;

            if (isExp) {
              return (
                <div
                  key={song.id}
                  className="station-row-expanded"
                  style={{ background: `linear-gradient(135deg, ${song.gradient[0]}, ${song.gradient[1]})` }}
                  onClick={() => setExpanded(null)}
                >
                  <div className="flex items-start justify-between">
                    <button
                      onClick={e => { e.stopPropagation(); onVote(song.id); }}
                      className="mt-1 active:scale-90 transition-transform"
                      aria-label="Votează"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill={voted.has(song.id) ? "white" : "none"} stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                      </svg>
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setExpanded(null); }}
                      className="text-white/60 active:scale-90 transition-transform"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M6 6l12 12M18 6L6 18"/>
                      </svg>
                    </button>
                  </div>
                  <div className="mt-2">
                    <div className="font-serif font-normal text-white" style={{ fontSize: "clamp(22px,6vw,28px)", lineHeight: 1.1, letterSpacing: "0.01em" }}>{song.genre}</div>
                    <div className="font-sans font-bold text-white text-[19px] mt-1">{song.title}</div>
                    <div className="font-sans text-white/60 text-[13px] mt-0.5">
                      {song.genre} · {song.duration} · {votes[song.id]} voturi
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2 mt-4" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => { onPlay(globalIdx); }}
                      className="flex items-center gap-1.5 px-4 h-9 rounded-full bg-white font-sans text-[13px] font-semibold active:scale-95 transition-transform"
                      style={{ color: song.gradient[0] }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                      Ascultă
                    </button>
                    <button className="flex items-center gap-1.5 px-4 h-9 rounded-full bg-white/20 font-sans text-[13px] text-white font-medium active:scale-95 transition-transform">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16"/></svg>
                      Descarcă
                    </button>
                    <button className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center active:scale-95 transition-transform">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={song.id}
                className="station-row"
                style={{ background: `${song.gradient[0]}` }}
                onClick={() => setExpanded(song.id)}
              >
                <button
                  onClick={e => { e.stopPropagation(); onVote(song.id); }}
                  className="shrink-0 active:scale-90 transition-transform"
                  aria-label="Votează"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={voted.has(song.id) ? "white" : "none"} stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                  </svg>
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {isPlaying && <span className="w-1.5 h-1.5 rounded-full bg-white animate-breathe shrink-0" />}
                    <span className="font-sans font-semibold text-white text-[15px] truncate">{song.title}</span>
                  </div>
                </div>
                <span className="font-mono text-[10px] shrink-0 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.65)" }}>
                  {song.genre}
                </span>
              </div>
            );
          })}

          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}
