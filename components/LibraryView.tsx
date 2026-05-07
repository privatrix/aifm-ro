"use client";
import { useMemo, useState } from "react";
import { Song } from "@/lib/data";

interface Props {
  songs: Song[];
  voted: Set<number>;
  votes: Record<number, number>;
  onVote: (id: number) => void;
  currentSong: Song;
  /** Switch song & jump to player (keeps old behaviour available). */
  onPlay: (idx: number) => void;
  /** Switch song and start audio without leaving Library. */
  onPlayInline: (idx: number) => void;
  /** Toggle play/pause for the currently active song without changing track. */
  onToggleInline: () => void;
  /** True when the audio is actively playing. */
  isPlaying: boolean;
  onBack: () => void;
}

type SortKey = "alpha" | "votes" | "duration" | "genre" | "bpm";
const SORT_LABEL: Record<SortKey, string> = {
  alpha: "A → Z",
  votes: "Voturi",
  duration: "Durată",
  genre: "Gen",
  bpm: "BPM",
};

function durationToSec(d: string): number {
  const [m, s] = d.split(":").map(Number);
  return (m || 0) * 60 + (s || 0);
}

export default function LibraryView({
  songs, voted, votes, onVote, currentSong,
  onPlay, onPlayInline, onToggleInline, isPlaying,
  onBack,
}: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("alpha");
  const [sortAsc, setSortAsc] = useState(true);
  const [showSort, setShowSort] = useState(false);
  const [activeGenre, setActiveGenre] = useState<string | "all">("all");
  const [favOnly, setFavOnly] = useState(false);

  // Distinct genres
  const genres = useMemo(() => {
    const set = new Set<string>();
    songs.forEach(s => set.add(s.genre));
    return ["all" as const, ...Array.from(set).sort()];
  }, [songs]);

  // Filtered + sorted list
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = songs.filter(s => {
      if (favOnly && !voted.has(s.id)) return false;
      if (activeGenre !== "all" && s.genre !== activeGenre) return false;
      if (!q) return true;
      return s.title.toLowerCase().includes(q) || s.genre.toLowerCase().includes(q);
    });

    list = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "alpha":    cmp = a.title.localeCompare(b.title, "ro"); break;
        case "votes":    cmp = (votes[a.id] ?? 0) - (votes[b.id] ?? 0); break;
        case "duration": cmp = durationToSec(a.duration) - durationToSec(b.duration); break;
        case "genre":    cmp = a.genre.localeCompare(b.genre, "ro") || a.title.localeCompare(b.title, "ro"); break;
        case "bpm":      cmp = (a.bpm ?? 0) - (b.bpm ?? 0); break;
      }
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [songs, query, sortKey, sortAsc, activeGenre, favOnly, voted, votes]);

  // Group when sorting alphabetically (letter buckets) or by genre.
  const groups: { label: string; items: Song[] }[] = useMemo(() => {
    if (sortKey === "alpha") {
      const map = new Map<string, Song[]>();
      visible.forEach(s => {
        const k = (s.title.charAt(0) || "?").toUpperCase();
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(s);
      });
      return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
    }
    if (sortKey === "genre") {
      const map = new Map<string, Song[]>();
      visible.forEach(s => {
        if (!map.has(s.genre)) map.set(s.genre, []);
        map.get(s.genre)!.push(s);
      });
      return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
    }
    return [{ label: "", items: visible }];
  }, [visible, sortKey]);

  const totalShown = visible.length;

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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </button>
            <h1 className="font-serif font-normal text-[24px] flex-1" style={{ color: "#1a1820" }}>Bibliotecă</h1>
            <span className="font-mono text-[11px]" style={{ color: "#8e8e93" }}>{totalShown} / {songs.length}</span>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="search"
              placeholder="Caută piese sau gen..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 rounded-2xl font-sans text-[14px] outline-none"
              style={{ background: "#f5f5f7", border: "1px solid #e5e5ea", color: "#1a1820" }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: "#e5e5ea", color: "#8e8e93" }}
                aria-label="Șterge"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18"/>
                </svg>
              </button>
            )}
          </div>

          {/* Toolbar: sort + favorites toggle */}
          <div className="flex items-center gap-2 mb-2">
            <div className="relative">
              <button
                onClick={() => setShowSort(s => !s)}
                className="flex items-center gap-1.5 h-8 px-3 rounded-full font-sans text-[12px] font-medium active:scale-95 transition-transform"
                style={{ background: "#f5f5f7", border: "1px solid #e5e5ea", color: "#1a1820" }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h13M3 12h9M3 18h5"/>
                  <path d="M17 6l4 4M17 18l4-4"/>
                </svg>
                {SORT_LABEL[sortKey]}
                <span style={{ color: "#8e8e93" }}>{sortAsc ? "↑" : "↓"}</span>
              </button>
              {showSort && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSort(false)} />
                  <div
                    className="absolute top-9 left-0 z-20 rounded-2xl py-1 min-w-[160px]"
                    style={{ background: "white", border: "1px solid #e5e5ea", boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}
                  >
                    {(Object.keys(SORT_LABEL) as SortKey[]).map(k => (
                      <button
                        key={k}
                        onClick={() => {
                          if (sortKey === k) setSortAsc(a => !a);
                          else { setSortKey(k); setSortAsc(true); }
                        }}
                        className="w-full px-3 py-2 flex items-center justify-between font-sans text-[13px] active:bg-pink-50"
                        style={{ color: sortKey === k ? "#C2185B" : "#1a1820" }}
                      >
                        <span>{SORT_LABEL[k]}</span>
                        {sortKey === k && <span style={{ color: "#C2185B" }}>{sortAsc ? "↑" : "↓"}</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setFavOnly(f => !f)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-full font-sans text-[12px] font-medium active:scale-95 transition-transform"
              style={{
                background: favOnly ? "#FCE4EC" : "#f5f5f7",
                border: `1px solid ${favOnly ? "#F8BBD0" : "#e5e5ea"}`,
                color: favOnly ? "#C2185B" : "#1a1820",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill={favOnly ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
              Favorite
            </button>

            <div className="ml-auto font-mono text-[10px] tracking-widest uppercase" style={{ color: "#8e8e93" }}>
              {voted.size} ♥
            </div>
          </div>

          {/* Genre chips */}
          <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1" style={{ scrollbarWidth: "none" }}>
            {genres.map(g => {
              const on = activeGenre === g;
              const label = g === "all" ? "Toate" : g;
              return (
                <button
                  key={g}
                  onClick={() => setActiveGenre(g)}
                  className="shrink-0 h-7 px-3 rounded-full font-sans text-[11px] font-medium active:scale-95 transition-transform"
                  style={{
                    background: on ? "linear-gradient(135deg, #E91E8C, #C2185B)" : "#f5f5f7",
                    color: on ? "white" : "#1a1820",
                    border: on ? "none" : "1px solid #e5e5ea",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* List */}
        <div className="view-scroll">
          {totalShown === 0 && (
            <div className="text-center py-16 font-sans text-[14px]" style={{ color: "#8e8e93" }}>
              Nicio piesă găsită.
            </div>
          )}

          {groups.map(group => (
            <div key={group.label || "_"}>
              {group.label && (
                <div
                  className="px-5 py-2 font-mono text-[10px] tracking-widest uppercase sticky top-0 z-[1]"
                  style={{ color: "#8e8e93", background: "white", borderBottom: "1px solid #f1f1f3" }}
                >
                  {group.label}
                </div>
              )}

              {group.items.map(song => {
                const globalIdx = songs.findIndex(s => s.id === song.id);
                const isCurrent = currentSong.id === song.id;
                const isExp = expanded === song.id;

                if (isExp) {
                  return (
                    <div
                      key={song.id}
                      className="px-5 py-4 cursor-pointer"
                      style={{ background: `linear-gradient(135deg, ${song.gradient[0]}, ${song.gradient[1]})` }}
                      onClick={() => setExpanded(null)}
                    >
                      <div className="flex items-start justify-between">
                        <button
                          onClick={e => { e.stopPropagation(); onVote(song.id); }}
                          className="active:scale-90 transition-transform"
                          aria-label="Votează"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill={voted.has(song.id) ? "white" : "none"} stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                          </svg>
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setExpanded(null); }}
                          className="text-white/70 active:scale-90 transition-transform"
                          aria-label="Închide"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M6 6l12 12M18 6L6 18"/>
                          </svg>
                        </button>
                      </div>
                      <div className="mt-2">
                        <div className="font-serif font-normal text-white" style={{ fontSize: "clamp(22px,6vw,28px)", lineHeight: 1.1 }}>{song.genre}</div>
                        <div className="font-sans font-bold text-white text-[19px] mt-1">{song.title}</div>
                        <div className="font-sans text-white/70 text-[13px] mt-0.5">
                          {song.duration} · {votes[song.id] ?? 0} voturi · {song.bpm} BPM
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => { onPlayInline(globalIdx); setExpanded(null); }}
                          className="flex items-center gap-1.5 px-4 h-9 rounded-full bg-white font-sans text-[13px] font-semibold active:scale-95 transition-transform"
                          style={{ color: song.gradient[0] }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                          Ascultă aici
                        </button>
                        <button
                          onClick={() => { onPlay(globalIdx); }}
                          className="flex items-center gap-1.5 px-4 h-9 rounded-full font-sans text-[13px] text-white font-medium active:scale-95 transition-transform"
                          style={{ background: "rgba(255,255,255,0.20)" }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M6.3 6.3a9 9 0 000 11.4M17.7 6.3a9 9 0 010 11.4"/>
                          </svg>
                          În Radio
                        </button>
                        <button
                          onClick={async () => {
                            const url = typeof window !== "undefined" ? window.location.href : "";
                            try {
                              if (typeof navigator !== "undefined" && "share" in navigator) {
                                await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share({ title: "AIFM", text: `„${song.title}” pe AIFM`, url });
                                return;
                              }
                            } catch {}
                            try { await navigator.clipboard?.writeText(url); } catch {}
                          }}
                          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
                          style={{ background: "rgba(255,255,255,0.20)" }}
                          aria-label="Distribuie"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                            <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                }

                // Compact row with inline play button
                return (
                  <div
                    key={song.id}
                    onClick={() => setExpanded(song.id)}
                    className="flex items-center gap-3 px-5 py-2.5 cursor-pointer active:bg-pink-50"
                    style={{ borderBottom: "1px solid #f6f6f8" }}
                  >
                    {/* Inline play / pause */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        if (isCurrent) onToggleInline();
                        else onPlayInline(globalIdx);
                      }}
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white active:scale-90 transition-transform"
                      style={{ background: `linear-gradient(135deg, ${song.gradient[0]}, ${song.gradient[1]})` }}
                      aria-label={isCurrent && isPlaying ? "Pauză" : "Ascultă"}
                    >
                      {isCurrent && isPlaying ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="6" y="5" width="4" height="14" rx="1.5"/>
                          <rect x="14" y="5" width="4" height="14" rx="1.5"/>
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}>
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      )}
                    </button>

                    {/* Title + meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {isCurrent && isPlaying && (
                          <span className="w-1.5 h-1.5 rounded-full animate-breathe shrink-0" style={{ background: song.gradient[0] }} />
                        )}
                        <span
                          className="font-sans font-semibold text-[14.5px] truncate"
                          style={{ color: isCurrent ? "#C2185B" : "#1a1820" }}
                        >
                          {song.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 font-mono text-[10px] tracking-wider uppercase" style={{ color: "#8e8e93" }}>
                        <span>{song.genre}</span>
                        <span>·</span>
                        <span>{song.duration}</span>
                        <span>·</span>
                        <span>{votes[song.id] ?? 0} ♥</span>
                      </div>
                    </div>

                    {/* Heart toggle */}
                    <button
                      onClick={e => { e.stopPropagation(); onVote(song.id); }}
                      className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                      aria-label="Votează"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24"
                        fill={voted.has(song.id) ? "#E91E8C" : "none"}
                        stroke={voted.has(song.id) ? "#E91E8C" : "#c7c7cc"}
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          ))}

          <div className="h-24" />
        </div>

        {/* Sticky mini-player at the bottom of the white sheet */}
        <div
          className="absolute left-0 right-0 px-3"
          style={{ bottom: 8 }}
        >
          <div
            className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl"
            style={{
              background: `linear-gradient(135deg, ${currentSong.gradient[0]}, ${currentSong.gradient[1]})`,
              boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
              style={{ background: "rgba(255,255,255,0.18)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-sans font-semibold text-white text-[13px] truncate">{currentSong.title}</div>
              <div className="font-mono text-[10px] tracking-widest uppercase text-white/70">
                {isPlaying ? "ascultă acum" : "în pauză"} · {currentSong.genre}
              </div>
            </div>
            <button
              onClick={onToggleInline}
              className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform"
              style={{ background: "rgba(255,255,255,0.22)" }}
              aria-label={isPlaying ? "Pauză" : "Ascultă"}
            >
              {isPlaying ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="1.5"/>
                  <rect x="14" y="5" width="4" height="14" rx="1.5"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}>
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
