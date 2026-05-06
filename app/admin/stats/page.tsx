"use client";

import { useEffect, useState } from "react";

interface Stats {
  songs: { total: number; active: number; draft: number; archived: number };
  notes: { pending: number; read: number; public: number };
  plays: { total: number; last24h: number };
  listenersNow: number;
  topVoted: Array<{ id: number; title: string; genre: string; votes: number; played_count: number }>;
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch("/api/admin/stats", { cache: "no-store" })
        .then(r => r.json())
        .then(j => {
          if (cancelled) return;
          if (j.ok) setStats(j as Stats);
          else setErr(j.error || "error");
        })
        .catch(() => setErr("network error"));
    };
    load();
    const t = setInterval(load, 15000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  if (err) return <div className="text-sm" style={{ color: "#ff7370" }}>{err}</div>;
  if (!stats) return <div className="font-mono text-sm" style={{ color: "rgba(236,231,216,0.5)" }}>Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-serif">Stats</h1>
        <p className="text-[12px] mt-0.5" style={{ color: "rgba(236,231,216,0.5)" }}>
          Auto-refreshes every 15 seconds.
        </p>
      </div>

      {/* Big numbers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Listeners now" value={stats.listenersNow} accent />
        <Stat label="Plays (24h)" value={stats.plays.last24h} />
        <Stat label="Active songs" value={stats.songs.active} />
        <Stat label="Pending notes" value={stats.notes.pending} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Songs breakdown */}
        <div className="admin-card p-4">
          <h2 className="admin-label">Songs</h2>
          <ul className="space-y-1.5 mt-2">
            <Row label="Total" value={stats.songs.total} />
            <Row label="Active" value={stats.songs.active} color="#84d488" />
            <Row label="Draft" value={stats.songs.draft} color="#ffb86b" />
            <Row label="Archived" value={stats.songs.archived} color="#a0a0a0" />
          </ul>
        </div>

        {/* Notes breakdown */}
        <div className="admin-card p-4">
          <h2 className="admin-label">Notes</h2>
          <ul className="space-y-1.5 mt-2">
            <Row label="Pending" value={stats.notes.pending} color="#ffb86b" />
            <Row label="Read" value={stats.notes.read} color="#84d488" />
            <Row label="Public" value={stats.notes.public} color="#ffb1cc" />
          </ul>
        </div>
      </div>

      {/* Top voted */}
      <div className="admin-card overflow-hidden">
        <div className="px-4 pt-3 pb-2">
          <h2 className="admin-label">Top voted</h2>
        </div>
        {stats.topVoted.length === 0 ? (
          <div className="px-4 py-6 text-center font-mono text-[11px] uppercase tracking-widest" style={{ color: "rgba(236,231,216,0.4)" }}>
            no votes yet
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Genre</th>
                <th>Votes</th>
                <th>Plays</th>
              </tr>
            </thead>
            <tbody>
              {stats.topVoted.map((s, i) => (
                <tr key={s.id}>
                  <td className="mono" style={{ color: "rgba(236,231,216,0.45)" }}>{i + 1}</td>
                  <td style={{ color: "#f5efe2" }}>{s.title}</td>
                  <td>{s.genre}</td>
                  <td className="mono">{s.votes}</td>
                  <td className="mono">{s.played_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="admin-card p-4">
      <div className="admin-label">{label}</div>
      <div
        className="font-serif mt-1"
        style={{
          fontSize: "32px",
          color: accent ? "#ffb1cc" : "#f5efe2",
          lineHeight: 1.1,
        }}
      >
        {value.toLocaleString("ro-RO")}
      </div>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <li className="flex items-center justify-between text-sm">
      <span style={{ color: "rgba(236,231,216,0.7)" }}>{label}</span>
      <span className="mono font-semibold" style={{ color: color ?? "#f5efe2" }}>
        {value.toLocaleString("ro-RO")}
      </span>
    </li>
  );
}
