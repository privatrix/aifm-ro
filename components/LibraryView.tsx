"use client";
import { useState } from "react";
import { Song, Genre } from "@/lib/data";

interface Props {
  songs: Song[];
  voted: Set<number>;
  votes: Record<number, number>;
  onVote: (id: number) => void;
  currentSong: Song;
  onPlay: (idx: number) => void;
}

const GENRES: (Genre | "Toate")[] = ["Toate", "Ambient", "Lo-fi", "Electronic", "Jazz", "Indie", "Synthwave", "Pop", "Folk"];

export default function LibraryView({ songs, voted, votes, onVote, currentSong, onPlay }: Props) {
  const [filter, setFilter]       = useState<Genre | "Toate">("Toate");
  const [query, setQuery]         = useState("");
  const [expanded, setExpanded]   = useState<number | null>(null);

  const visible = songs.filter(s => {
    const matchGenre = filter === "Toate" || s.genre === filter;
    const matchQuery = s.title.toLowerCase().includes(query.toLowerCase()) || s.genre.toLowerCase().includes(query.toLowerCase());
    return matchGenre && matchQuery;
  });

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Header */}
      <div className="view-header">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-serif text-[22px] text-white">Bibliotecă</h1>
          <span className="tag text-muted">{songs.length} piese</span>
        </div>
        {/* Search */}
        <div className="relative mb-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="search"
            placeholder="Caută piese..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl font-mono text-sm text-white placeholder-white/30 outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          />
        </div>
        {/* Genre filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth: "none" }}>
          {GENRES.map(g => (
            <button
              key={g}
              onClick={() => setFilter(g)}
              className="shrink-0 font-mono text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-full transition-all duration-150"
              style={{
                background: filter === g ? "linear-gradient(135deg, #E91E8C, #9C1458)" : "rgba(255,255,255,0.06)",
                color: filter === g ? "#fff" : "rgba(255,255,255,0.5)",
                border: filter === g ? "none" : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Song grid */}
      <div className="view-scroll px-4 pt-4 pb-4">
        {visible.length === 0 && (
          <div className="text-center py-16 text-muted font-mono text-sm">Nicio piesă găsită.</div>
        )}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((song, i) => {
            const isExpanded = expanded === song.id;
            const isPlaying  = currentSong.id === song.id;
            return (
              <div
                key={song.id}
                className="song-card"
                onClick={() => setExpanded(isExpanded ? null : song.id)}
              >
                {/* Gradient face */}
                <div
                  className="relative aspect-square flex flex-col justify-between p-3"
                  style={{ background: `linear-gradient(150deg, ${song.gradient[0]}, ${song.gradient[1]})` }}
                >
                  {/* Playing indicator */}
                  {isPlaying && (
                    <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-white/25 flex items-center justify-center">
                      <span className="block w-1.5 h-1.5 rounded-full bg-white animate-breathe" />
                    </div>
                  )}
                  <span className="font-mono text-[9px] text-white/50 tracking-wider">#{String(song.id).padStart(2, "0")}</span>
                  <div>
                    <div className="genre-pill mb-1">{song.genre}</div>
                    <div className="font-serif text-[13px] text-white leading-tight">{song.title}</div>
                  </div>
                </div>

                {/* Info strip */}
                <div
                  className="px-3 py-2 flex items-center justify-between"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  <span className="font-mono text-[10px] text-muted">{song.duration}</span>
                  <button
                    onClick={e => { e.stopPropagation(); onVote(song.id); }}
                    className="flex items-center gap-1 transition-colors duration-100"
                    style={{ color: voted.has(song.id) ? "#FF4081" : "rgba(255,255,255,0.4)" }}
                    aria-label="Votează"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill={voted.has(song.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                    </svg>
                    <span className="font-mono text-[10px]">{votes[song.id]}</span>
                  </button>
                </div>

                {/* Expanded actions */}
                {isExpanded && (
                  <div
                    className="border-t animate-slide-up"
                    style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.35)" }}
                  >
                    <button
                      onClick={e => { e.stopPropagation(); onPlay(i); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 font-sans text-[13px] text-white hover:bg-white/5 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                      Ascultă
                    </button>
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2.5 font-sans text-[13px] text-white/70 hover:bg-white/5 transition-colors"
                      onClick={e => e.stopPropagation()}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16"/></svg>
                      Descarcă
                    </button>
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2.5 font-sans text-[13px] text-white/70 hover:bg-white/5 transition-colors"
                      onClick={e => e.stopPropagation()}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>
                      Distribuie
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
