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
}

type Period = "saptamana" | "toate";

export default function TopView({ songs, voted, votes, onVote, currentSong, onPlay }: Props) {
  const [period, setPeriod] = useState<Period>("saptamana");

  const sorted = [...songs]
    .sort((a, b) => votes[b.id] - votes[a.id])
    .slice(0, period === "saptamana" ? 10 : 20);

  const maxVotes = sorted[0] ? votes[sorted[0].id] : 1;

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Header */}
      <div className="view-header">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-[22px] text-white">Top Voturi</h1>
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
            {([["saptamana", "Săptămâna"], ["toate", "Toate"]] as [Period, string][]).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setPeriod(id)}
                className="font-mono text-[10px] tracking-wider uppercase px-3 py-1 rounded-lg transition-all duration-150"
                style={{
                  background: period === id ? "linear-gradient(135deg, #E91E8C, #9C1458)" : "transparent",
                  color: period === id ? "#fff" : "rgba(255,255,255,0.45)",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="view-scroll">
        {sorted.map((song, i) => {
          const rank      = i + 1;
          const isPlaying = currentSong.id === song.id;
          const pct       = (votes[song.id] / maxVotes) * 100;

          return (
            <div
              key={song.id}
              className="rank-row"
              onClick={() => onPlay(songs.findIndex(s => s.id === song.id))}
            >
              {/* Color swatch */}
              <div
                className="w-1 self-stretch rounded-full shrink-0"
                style={{ background: `linear-gradient(to bottom, ${song.gradient[0]}, ${song.gradient[1]})` }}
              />

              {/* Rank */}
              <div className="w-7 shrink-0 text-center">
                {rank <= 3 ? (
                  <span className="font-serif text-lg" style={{ color: ["#FFD740","#9D8DB0","#E64A19"][rank - 1] }}>
                    {rank}
                  </span>
                ) : (
                  <span className="font-mono text-[11px] text-dim">{rank}</span>
                )}
              </div>

              {/* Info + bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {isPlaying && (
                    <span className="w-1.5 h-1.5 rounded-full bg-tungsten animate-breathe shrink-0" />
                  )}
                  <span className="font-serif text-[15px] text-white truncate">{song.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="genre-pill">{song.genre}</span>
                  <span className="font-mono text-[9px] text-dim">{song.duration}</span>
                </div>
                {/* Vote bar */}
                <div className="mt-1.5 h-[2px] rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: `linear-gradient(to right, ${song.gradient[0]}, ${song.gradient[1]})` }}
                  />
                </div>
              </div>

              {/* Votes + heart */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="font-mono text-[13px] font-medium" style={{ color: song.gradient[0] }}>
                  {votes[song.id]}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); onVote(song.id); }}
                  className="transition-transform active:scale-90"
                  aria-label="Votează"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={voted.has(song.id) ? "#FF4081" : "none"} stroke={voted.has(song.id) ? "#FF4081" : "rgba(255,255,255,0.35)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                  </svg>
                </button>
              </div>
            </div>
          );
        })}

        {/* Footer */}
        <div className="text-center py-8 font-mono text-[10px] text-dim tracking-wider">
          VOTURI ACTUALIZATE ÎN TIMP REAL
        </div>
      </div>
    </div>
  );
}
