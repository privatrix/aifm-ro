"use client";
/**
 * Sub-screens of the profile area:
 *   - "favorites" : the user's saved songs
 *   - "notes"     : bilete the user has sent (with read/reply status)
 *   - "history"   : last 30 days of personal listening, aggregated per song
 *
 * One component, three modes — the parent passes `mode` and `onBack`.
 *
 * Each tab fetches its own data once when opened. Empty / error / loading
 * states are handled inline. We keep the layout simple (header + scrollable
 * list) so it composes well with the existing white-view styling used in
 * the library and notes views.
 */
import { useEffect, useState } from "react";

export type DetailMode = "favorites" | "notes" | "history";

interface FavoriteRow {
  id: number;
  title: string;
  genre: string;
  durationSeconds: number;
  freq: string;
  votes: number;
  addedAt: string;
}

interface NoteRow {
  id: number;
  text: string;
  status: "pending" | "read" | "archived";
  reply: string | null;
  timeLabel: string;
  createdAt: string;
  readAt: string | null;
  public: boolean;
}

interface HistoryRow {
  songId: number;
  title: string;
  genre: string;
  freq: string;
  lastPlayed: string;
  totalSeconds: number;
  plays: number;
}

interface Props {
  mode: DetailMode;
  onBack: () => void;
  onPlaySong?: (songId: number) => void;
}

const TITLES: Record<DetailMode, string> = {
  favorites: "Piesele mele favorite",
  notes:     "Biletele mele",
  history:   "Istoric ascultare",
};

export default function ProfileDetailView({ mode, onBack, onPlaySong }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<FavoriteRow[] | null>(null);
  const [notes, setNotes] = useState<NoteRow[] | null>(null);
  const [history, setHistory] = useState<HistoryRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const url = mode === "favorites" ? "/api/me/favorites"
                  : mode === "notes"     ? "/api/me/notes"
                  : "/api/me/history";
        const res = await fetch(url, { cache: "no-store" });
        const j = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok || !j?.ok) {
          setError(j?.error ?? "Ceva nu a mers.");
        } else {
          if (mode === "favorites") setFavorites(j.favorites ?? []);
          if (mode === "notes")     setNotes(j.notes ?? []);
          if (mode === "history")   setHistory(j.history ?? []);
        }
      } catch {
        if (!cancelled) setError("Conexiune eșuată.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [mode]);

  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="white-view">
        <div className="white-header">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={onBack}
              className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: "#FCE4EC", color: "#C2185B" }}
              aria-label="Înapoi"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </button>
            <h1 className="font-serif font-normal text-[24px] flex-1" style={{ color: "#1a1820" }}>
              {TITLES[mode]}
            </h1>
          </div>
        </div>

        <div className="white-body">
          {loading && <Empty text="Se încarcă…" />}
          {!loading && error && <Empty text={error} />}
          {!loading && !error && mode === "favorites" && (favorites?.length
            ? <FavoritesList rows={favorites} onPlay={onPlaySong} />
            : <Empty text="Nu ai piese salvate încă." hint="Apasă inima de pe o piesă ca să o salvezi aici." />)}
          {!loading && !error && mode === "notes" && (notes?.length
            ? <NotesList rows={notes} />
            : <Empty text="Nu ai bilete trimise încă." hint="Trimite-i un bilet lui Vio din pagina Radio." />)}
          {!loading && !error && mode === "history" && (history?.length
            ? <HistoryList rows={history} onPlay={onPlaySong} />
            : <Empty text="Niciun istoric încă." hint="Ascultă câteva piese — apar aici după ce trec prin tine." />)}
        </div>
      </div>
    </div>
  );
}

function Empty({ text, hint }: { text: string; hint?: string }) {
  return (
    <div className="px-6 py-12 text-center">
      <div className="font-sans text-[14px]" style={{ color: "#1a1820" }}>{text}</div>
      {hint && <div className="font-sans text-[12px] mt-2" style={{ color: "#8e8e93" }}>{hint}</div>}
    </div>
  );
}

function FavoritesList({ rows, onPlay }: { rows: FavoriteRow[]; onPlay?: (id: number) => void }) {
  return (
    <ul className="flex flex-col">
      {rows.map((r) => (
        <li key={r.id}>
          <button
            onClick={() => onPlay?.(r.id)}
            className="w-full flex items-center gap-3 px-4 py-3 active:bg-pink-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                 style={{ background: "linear-gradient(135deg, #E91E8C, #C2185B)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="font-sans font-semibold text-[14px] truncate" style={{ color: "#1a1820" }}>{r.title}</div>
              <div className="font-sans text-[11px] truncate" style={{ color: "#8e8e93" }}>
                {r.genre} · {formatDuration(r.durationSeconds)} · {r.freq} MHz
              </div>
            </div>
            <span className="font-mono text-[10px] tracking-wider" style={{ color: "#bcbcc1" }}>
              {timeAgo(r.addedAt)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function NotesList({ rows }: { rows: NoteRow[] }) {
  return (
    <ul className="flex flex-col gap-3 px-4">
      {rows.map((r) => (
        <li key={r.id} className="rounded-2xl px-4 py-3" style={{ background: "#f5f5f7" }}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: r.status === "read" ? "#1a8a3a" : "#8e8e93" }}>
              {r.status === "read" ? "Vio a citit" : r.status === "archived" ? "arhivat" : "așteaptă"}
            </span>
            <span className="font-mono text-[10px]" style={{ color: "#bcbcc1" }}>{timeAgo(r.createdAt)}</span>
          </div>
          <p className="font-serif italic text-[14px]" style={{ color: "#1a1820" }}>&ldquo;{r.text}&rdquo;</p>
          {r.reply && (
            <div className="mt-2 pt-2 border-t" style={{ borderColor: "#e5e5ea" }}>
              <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "#C2185B" }}>răspuns Vio</span>
              <p className="font-sans text-[13px] mt-1" style={{ color: "#1a1820" }}>{r.reply}</p>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function HistoryList({ rows, onPlay }: { rows: HistoryRow[]; onPlay?: (id: number) => void }) {
  return (
    <ul className="flex flex-col">
      {rows.map((r) => (
        <li key={r.songId}>
          <button
            onClick={() => onPlay?.(r.songId)}
            className="w-full flex items-center gap-3 px-4 py-3 active:bg-pink-50 transition-colors"
          >
            <div className="flex-1 min-w-0 text-left">
              <div className="font-sans font-semibold text-[14px] truncate" style={{ color: "#1a1820" }}>{r.title}</div>
              <div className="font-sans text-[11px] truncate" style={{ color: "#8e8e93" }}>
                {r.genre} · {r.plays}× · {Math.round(r.totalSeconds / 60)} min
              </div>
            </div>
            <span className="font-mono text-[10px] tracking-wider" style={{ color: "#bcbcc1" }}>
              {timeAgo(r.lastPlayed)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function formatDuration(s: number): string {
  if (!s || s <= 0) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "acum";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}z`;
  const w = Math.floor(d / 7);
  if (w < 4) return `${w}săpt`;
  return new Date(iso).toLocaleDateString("ro-RO", { day: "numeric", month: "short" });
}
