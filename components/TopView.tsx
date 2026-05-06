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

  const rankColor = (i: number) => {
    if (i === 0) return "#F59E0B";
    if (i === 1) return "#9CA3AF";
    if (i === 2) return "#D97706";
    return "#C4B5FD";
  };

  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: "#3B1A60" }}>
      <div className="white-view">

        {/* Header */}
        <div className="white-header">
          <div className="flex items-center justify-between">
            <h1 className="font-sans font-bold text-[20px] text-ink">Top Voturi</h1>
            <div className="flex gap-1 p-1 rounded-full" style={{ background: "#f5f5f5" }}>
              {([["saptamana", "Săptămâna"], ["toate", "Toate"]] as [Period, string][]).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setPeriod(id)}
                  className="pill-btn"
                  style={{
                    background: period === id ? "linear-gradient(135deg, #E91E8C, #C2185B)" : "transparent",
                    color: period === id ? "#fff" : "#888",
                    height: "30px",
                    padding: "0 12px",
                    fontSize: "11px",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ranked list */}
        <div className="view-scroll">
          {sorted.map((song, i) => {
            const isPlaying = currentSong.id === song.id;
            const pct       = (votes[song.id] / maxVotes) * 100;
            const rank      = i + 1;

            return (
              <div
                key={song.id}
                className="flex items-center gap-3 px-5 py-3 cursor-pointer active:bg-gray-50 transition-colors border-b border-gray-50"
                onClick={() => onPlay(songs.findIndex(s => s.id === song.id))}
              >
                {/* Color bar */}
                <div
                  className="w-1 h-10 rounded-full shrink-0"
                  style={{ background: `linear-gradient(to bottom, ${song.gradient[0]}, ${song.gradient[1]})` }}
                />

                {/* Rank number */}
                <div className="w-7 text-center shrink-0">
                  <span
                    className="font-sans font-bold text-[18px]"
                    style={{ color: rankColor(i) }}
                  >
                    {rank}
                  </span>
                </div>

                {/* Song info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {isPlaying && (
                      <span className="w-1.5 h-1.5 rounded-full animate-breathe shrink-0" style={{ background: "#E91E8C" }} />
                    )}
                    <span className="font-sans font-semibold text-[14px] text-ink truncate">{song.title}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="font-sans text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: `${song.gradient[0]}20`, color: song.gradient[0] }}
                    >
                      {song.genre}
                    </span>
                    <span className="font-sans text-[11px] text-gray-400">{song.duration}</span>
                  </div>
                  {/* Vote bar */}
                  <div className="h-[2px] rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: `linear-gradient(to right, ${song.gradient[0]}, ${song.gradient[1]})` }}
                    />
                  </div>
                </div>

                {/* Votes + heart */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="font-sans font-bold text-[14px]" style={{ color: song.gradient[0] }}>
                    {votes[song.id]}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); onVote(song.id); }}
                    className="active:scale-90 transition-transform"
                    aria-label="Votează"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={voted.has(song.id) ? "#E91E8C" : "none"} stroke={voted.has(song.id) ? "#E91E8C" : "#ddd"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
          <div className="text-center py-6 font-sans text-[11px] text-gray-300 tracking-wider">
            ACTUALIZAT ÎN TIMP REAL
          </div>
        </div>
      </div>
    </div>
  );
}
