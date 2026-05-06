"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Song } from "@/db/schema";
import { GENRES, STATUSES } from "@/lib/songs";

type SortKey = "id" | "title" | "freq" | "votes" | "playedCount";

export default function SongsTable({ initialSongs }: { initialSongs: Song[] }) {
  const router = useRouter();
  const [songs, setSongs] = useState<Song[]>(initialSongs);
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [genreFilter, setGenreFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [busy, setBusy] = useState<number | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function togglePlay(s: Song) {
    if (!s.fileUrl) return;
    const a = audioRef.current;
    if (!a) return;
    if (playingId === s.id) {
      a.pause();
      setPlayingId(null);
      return;
    }
    a.src = s.fileUrl;
    a.play()
      .then(() => setPlayingId(s.id))
      .catch(() => setPlayingId(null));
  }

  const filtered = useMemo(() => {
    let out = [...songs];
    if (genreFilter) out = out.filter((s) => s.genre === genreFilter);
    if (statusFilter) out = out.filter((s) => s.status === statusFilter);
    out.sort((a, b) => {
      const av = a[sortKey] as unknown as number | string;
      const bv = b[sortKey] as unknown as number | string;
      if (av === bv) return 0;
      const cmp = av > bv ? 1 : -1;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return out;
  }, [songs, sortKey, sortDir, genreFilter, statusFilter]);

  function toggleSort(k: SortKey) {
    if (k === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("desc");
    }
  }

  async function patch(id: number, body: Record<string, unknown>) {
    setBusy(id);
    try {
      const r = await fetch(`/api/admin/songs/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (j.ok) {
        setSongs((prev) => prev.map((s) => (s.id === id ? j.song : s)));
      } else {
        alert("Error: " + (j.error || "unknown"));
      }
    } finally {
      setBusy(null);
    }
  }

  async function archive(id: number) {
    if (!confirm("Archive this song?")) return;
    setBusy(id);
    try {
      const r = await fetch(`/api/admin/songs/${id}`, { method: "DELETE" });
      const j = await r.json();
      if (j.ok) setSongs((prev) => prev.map((s) => (s.id === id ? j.song : s)));
    } finally {
      setBusy(null);
    }
  }

  async function hardDelete(id: number) {
    if (!confirm("Permanently delete this song AND its audio file from R2? This cannot be undone.")) return;
    setBusy(id);
    try {
      const r = await fetch(`/api/admin/songs/${id}?hard=true`, { method: "DELETE" });
      const j = await r.json();
      if (j.ok) setSongs((prev) => prev.filter((s) => s.id !== id));
      else alert("Error: " + (j.error || "unknown"));
    } finally {
      setBusy(null);
    }
  }

  async function seed() {
    if (!confirm("Seed 20 sample songs from lib/data.ts?")) return;
    const r = await fetch("/api/admin/seed", { method: "POST" });
    const j = await r.json();
    if (j.ok) {
      alert(j.skipped ? "Skipped (table not empty)" : `Inserted ${j.inserted} songs`);
      router.refresh();
    } else {
      alert("Error: " + j.error);
    }
  }

  if (songs.length === 0) {
    return (
      <div className="admin-dropzone text-center">
        <p className="text-sm mb-4" style={{ color: "rgba(236,231,216,0.7)" }}>No songs yet.</p>
        <button onClick={seed} className="admin-btn admin-btn-primary">
          Seed sample songs
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <select
          value={genreFilter}
          onChange={(e) => setGenreFilter(e.target.value)}
          className="admin-select !w-auto !py-1.5"
        >
          <option value="">All genres</option>
          {GENRES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="admin-select !w-auto !py-1.5"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="text-xs mono" style={{ color: "rgba(236,231,216,0.5)" }}>{filtered.length} shown</span>
      </div>

      <div className="overflow-x-auto admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <Th onClick={() => toggleSort("id")} active={sortKey === "id"} dir={sortDir}>ID</Th>
              <Th onClick={() => toggleSort("title")} active={sortKey === "title"} dir={sortDir}>Title</Th>
              <th className="px-3 py-2 text-left">Genre</th>
              <Th onClick={() => toggleSort("freq")} active={sortKey === "freq"} dir={sortDir}>Freq</Th>
              <Th onClick={() => toggleSort("votes")} active={sortKey === "votes"} dir={sortDir}>Votes</Th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Pinned</th>
              <Th onClick={() => toggleSort("playedCount")} active={sortKey === "playedCount"} dir={sortDir}>Plays</Th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id}>
                <td style={{ color: "rgba(236,231,216,0.45)" }}>{s.id}</td>
                <td style={{ color: "#f5efe2" }}>
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
                    style={{ background: `linear-gradient(135deg, ${s.gradientFrom}, ${s.gradientTo})` }}
                  />
                  {s.fileUrl ? (
                    <button
                      onClick={() => togglePlay(s)}
                      title={playingId === s.id ? "Pause" : "Play"}
                      className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] mr-2 align-middle"
                      style={{ border: "1px solid rgba(255,255,255,0.15)", color: playingId === s.id ? "#E91E8C" : "rgba(236,231,216,0.65)" }}
                    >
                      {playingId === s.id ? "■" : "▶"}
                    </button>
                  ) : (
                    <span className="inline-block w-5 h-5 mr-2 align-middle text-[10px] text-center" style={{ color: "rgba(236,231,216,0.25)" }}>—</span>
                  )}
                  {s.title}
                </td>
                <td>{s.genre}</td>
                <td className="mono">{s.freq}</td>
                <td>{s.votes}</td>
                <td>
                  <span className={
                    s.status === "active" ? "admin-pill admin-pill-active" :
                    s.status === "archived" ? "admin-pill admin-pill-archived" :
                    "admin-pill admin-pill-draft"
                  }>
                    {s.status}
                  </span>
                </td>
                <td>{s.pinned ? "📌" : ""}</td>
                <td>{s.playedCount}</td>
                <td className="text-right space-x-3 whitespace-nowrap">
                  <Link href={`/admin/songs/${s.id}/edit`} className="admin-link">
                    Edit
                  </Link>
                  <button
                    disabled={busy === s.id}
                    onClick={() => patch(s.id, { pinned: !s.pinned })}
                    style={{ color: "rgba(236,231,216,0.7)" }}
                  >
                    {s.pinned ? "Unpin" : "Pin"}
                  </button>
                  {s.status === "archived" ? (
                    <button
                      disabled={busy === s.id}
                      onClick={() => patch(s.id, { status: "draft" })}
                      style={{ color: "rgba(236,231,216,0.7)" }}
                    >
                      Restore
                    </button>
                  ) : (
                    <button
                      disabled={busy === s.id}
                      onClick={() => archive(s.id)}
                      style={{ color: "#ff7370" }}
                    >
                      Archive
                    </button>
                  )}
                  {s.status === "archived" && (
                    <button
                      disabled={busy === s.id}
                      onClick={() => hardDelete(s.id)}
                      style={{ color: "#ff5050" }}
                      title="Permanently delete (incl. R2 file)"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <audio
        ref={audioRef}
        onEnded={() => setPlayingId(null)}
        onPause={() => {
          // Only clear if pause wasn't triggered by setting a new src.
          if (audioRef.current && audioRef.current.paused && audioRef.current.ended) setPlayingId(null);
        }}
        className="hidden"
      />
    </div>
  );
}

function Th({
  children,
  onClick,
  active,
  dir,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  dir: "asc" | "desc";
}) {
  return (
    <th>
      <button onClick={onClick} className="inline-flex items-center gap-1" style={{ color: active ? "#ffb1cc" : undefined }}>
        {children}
        {active && <span>{dir === "asc" ? "↑" : "↓"}</span>}
      </button>
    </th>
  );
}
