"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { SONGS as MOCK_SONGS, type Song } from "@/lib/data";
import Nav from "./Nav";
import RadioView from "./RadioView";
import LibraryView from "./LibraryView";
import NotesView from "./NotesView";
import MenuDrawer from "./MenuDrawer";
import ProfileView from "./ProfileView";

type Tab = "radio" | "biblioteca" | "bilete" | "profile";

interface NowPlaying {
  current: Song & { durationSeconds: number };
  startedAt: string;       // ISO
  elapsedSeconds: number;
  serverNow: string;       // ISO
  upNext: (Song & { durationSeconds: number }) | null;
  /** True when a fresh heartbeat from the live encoder backs this snapshot. */
  live?: boolean;
  lastHeartbeatAt?: string | null;
}

export default function App() {
  const [tab, setTab] = useState<Tab>("radio");
  const [menuOpen, setMenuOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteSent, setNoteSent] = useState(false);
  const [songs, setSongs] = useState<Song[]>(MOCK_SONGS);
  const [votes, setVotes] = useState<Record<number, number>>(
    () => Object.fromEntries(MOCK_SONGS.map(s => [s.id, s.votes]))
  );
  const [voted, setVoted] = useState<Set<number>>(new Set());

  // "Live mode": follow the server's now-playing. "Solo mode": user picked their own song.
  const [liveMode, setLiveMode] = useState(true);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [soloIdx, setSoloIdx] = useState(0);
  const [listenerCount, setListenerCount] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Pull catalog
  useEffect(() => {
    let cancelled = false;
    fetch("/api/songs", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled || !j?.ok || !Array.isArray(j.songs) || j.songs.length === 0) return;
        setSongs(j.songs as Song[]);
        setVotes(Object.fromEntries((j.songs as Song[]).map((s) => [s.id, s.votes])));
      })
      .catch(() => { /* keep mock */ });
    return () => { cancelled = true; };
  }, []);

  // 2. Poll /api/now every 7s while in live mode
  useEffect(() => {
    if (!liveMode) return;
    let cancelled = false;
    const fetchNow = async () => {
      try {
        const r = await fetch("/api/now", { cache: "no-store" });
        if (!r.ok) return;
        const j = await r.json();
        if (cancelled || !j?.ok) return;
        setNowPlaying({
          current: j.current,
          startedAt: j.startedAt,
          elapsedSeconds: j.elapsedSeconds,
          serverNow: j.serverNow,
          upNext: j.upNext,
          live: !!j.live,
          lastHeartbeatAt: j.lastHeartbeatAt ?? null,
        });
      } catch { /* network blip */ }
    };
    fetchNow();
    const t = setInterval(fetchNow, 7000);
    return () => { cancelled = true; clearInterval(t); };
  }, [liveMode]);

  // 3. Heartbeat for listener count (every 25s)
  useEffect(() => {
    let cancelled = false;
    const beat = async () => {
      try {
        const r = await fetch("/api/heartbeat", { method: "POST", cache: "no-store" });
        if (!r.ok) return;
        const j = await r.json();
        if (!cancelled && j?.ok) setListenerCount(j.listeners ?? null);
      } catch {}
    };
    beat();
    const t = setInterval(beat, 25000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  // The "current song" in live mode = server's; in solo mode = user's pick.
  const currentSong: Song | undefined = liveMode
    ? (nowPlaying?.current ?? songs[0])
    : songs[soloIdx];

  // 4. Sync audio src.
  //
  // Live mode: point at the Icecast broadcast URL. Every listener gets the
  // exact same bytes from the same offset — a true live radio stream.
  // Solo mode: per-song fileUrl from the catalogue.
  //
  // The live URL comes from NEXT_PUBLIC_STREAM_URL. Falls back to the legacy
  // per-song-fileUrl behaviour if the env var isn't set, so dev still works
  // before the encoder is up.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const liveUrl = process.env.NEXT_PUBLIC_STREAM_URL || "";
    if (liveMode && liveUrl) {
      if (a.src !== liveUrl) {
        a.src = liveUrl;
        a.load();
      }
      return;
    }

    // Solo mode (or live-mode fallback before stream is online).
    if (!currentSong?.fileUrl) return;
    if (a.src === currentSong.fileUrl) return;
    a.src = currentSong.fileUrl;
    a.load();
  }, [currentSong?.id, currentSong?.fileUrl, liveMode, nowPlaying?.startedAt]);

  // 5. Play/pause based on `playing`
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (playing && currentSong?.fileUrl) {
      const p = a.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => setPlaying(false));
      }
    } else {
      a.pause();
    }
  }, [playing, currentSong?.id, currentSong?.fileUrl]);

  // Vote handler (with API call)
  const toggleVote = useCallback(async (id: number) => {
    const wasVoted = voted.has(id);
    // Optimistic update
    setVoted(prev => {
      const next = new Set(prev);
      wasVoted ? next.delete(id) : next.add(id);
      return next;
    });
    setVotes(v => ({ ...v, [id]: Math.max(0, (v[id] || 0) + (wasVoted ? -1 : 1)) }));
    try {
      const r = await fetch(`/api/songs/${id}/vote`, { method: "POST", cache: "no-store" });
      if (!r.ok) throw new Error("vote failed");
      const j = await r.json();
      if (j?.ok) {
        // Reconcile with server truth
        setVotes(v => ({ ...v, [id]: j.votes ?? v[id] }));
        setVoted(prev => {
          const next = new Set(prev);
          j.voted ? next.add(id) : next.delete(id);
          return next;
        });
      }
    } catch {
      // Revert
      setVoted(prev => {
        const next = new Set(prev);
        wasVoted ? next.add(id) : next.delete(id);
        return next;
      });
      setVotes(v => ({ ...v, [id]: Math.max(0, (v[id] || 0) + (wasVoted ? 1 : -1)) }));
    }
  }, [voted]);

  // Engage solo mode when user manually changes track (jumps to player tab)
  function gotoSong(idx: number) {
    setLiveMode(false);
    setSoloIdx(idx);
    setTab("radio");
  }
  // Same as gotoSong but stays on the current tab and starts audio.
  function playSongInline(idx: number) {
    setLiveMode(false);
    setSoloIdx(idx);
    setPlaying(true);
  }
  function toggleInline() {
    setPlaying(p => !p);
  }
  function returnToLive() {
    setLiveMode(true);
  }

  const prevSong = () => {
    setLiveMode(false);
    setSoloIdx(i => {
      const cur = liveMode ? songs.findIndex(s => s.id === currentSong?.id) : i;
      return ((cur - 1) + songs.length) % songs.length;
    });
  };
  const nextSong = () => {
    setLiveMode(false);
    setSoloIdx(i => {
      const cur = liveMode ? songs.findIndex(s => s.id === currentSong?.id) : i;
      return ((cur + 1) % songs.length);
    });
  };
  const shuffleSong = () => {
    if (songs.length <= 1) return;
    setLiveMode(false);
    setSoloIdx(i => {
      const cur = liveMode ? songs.findIndex(s => s.id === currentSong?.id) : i;
      let next = Math.floor(Math.random() * songs.length);
      if (next === cur) next = (next + 1) % songs.length;
      return next;
    });
  };

  const submitNote = () => {
    if (!noteText.trim()) return;
    try {
      const KEY = "aifm:my-notes";
      const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
      const list: Array<{ id: string; text: string; createdAt: number }> =
        raw ? JSON.parse(raw) : [];
      list.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        text: noteText.trim(),
        createdAt: Date.now(),
      });
      if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(list));
    } catch { /* localStorage unavailable */ }
    // Also POST to backend (best-effort, stage 6 will wire admin inbox)
    void fetch("/api/notes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: noteText.trim() }),
    }).catch(() => {});
    setNoteSent(true);
    setTimeout(() => {
      setShowNote(false);
      setTimeout(() => { setNoteText(""); setNoteSent(false); }, 300);
    }, 1600);
  };

  // When auto-advance fires (in solo mode), step forward; in live mode let server do it.
  function handleAudioEnded() {
    if (liveMode) {
      // Refetch /api/now — server has already advanced.
      fetch("/api/now", { cache: "no-store" })
        .then(r => r.json())
        .then(j => {
          if (j?.ok) setNowPlaying(j);
        }).catch(() => {});
    } else {
      setSoloIdx(i => (i + 1) % songs.length);
    }
  }

  if (!currentSong) {
    return <div className="fixed inset-0 flex items-center justify-center text-bone/60 font-mono text-sm">Se încarcă…</div>;
  }

  return (
    <div className="fixed inset-0 flex flex-col">
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        preload="auto"
        playsInline
        crossOrigin="anonymous"
        className="hidden"
      />

      <div className="flex-1 min-h-0 relative overflow-hidden">
        {tab === "radio" && (
          <RadioView
            song={currentSong}
            songs={songs}
            playing={playing}
            setPlaying={setPlaying}
            voted={voted.has(currentSong.id)}
            votes={votes[currentSong.id] ?? 0}
            onVote={() => toggleVote(currentSong.id)}
            onPrev={prevSong}
            onNext={nextSong}
            onShuffle={shuffleSong}
            onNote={() => setShowNote(true)}
            onOpenLibrary={() => setMenuOpen(true)}
            liveMode={liveMode}
            onReturnToLive={returnToLive}
            upNext={nowPlaying?.upNext ?? null}
            listenerCount={listenerCount}
            broadcastLive={!!nowPlaying?.live}
          />
        )}
        {tab === "biblioteca" && (
          <LibraryView
            songs={songs}
            voted={voted}
            votes={votes}
            onVote={toggleVote}
            currentSong={currentSong}
            onPlay={gotoSong}
            onPlayInline={playSongInline}
            onToggleInline={toggleInline}
            isPlaying={playing}
            onBack={() => setTab("radio")}
          />
        )}
        {tab === "bilete" && (
          <NotesView onNote={() => setShowNote(true)} />
        )}
        {tab === "profile" && (
          <ProfileView
            user={null}
            onSignIn={() => { /* TODO: backend */ }}
            onSignUp={() => { /* TODO: backend */ }}
          />
        )}
      </div>

      <Nav active={tab} setActive={setTab} />

      <MenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={(target) => {
          if (target === "profile") setTab("profile");
          else if (target === "favorites") setTab("biblioteca");
          else if (target === "notes") setTab("bilete");
          else if (target === "history" || target === "settings" || target === "help") {
            // Routed to profile for now; dedicated views can be added later.
            setTab("profile");
          }
        }}
        user={null}
        onSignIn={() => setTab("profile")}
        onSignUp={() => setTab("profile")}
      />

      {showNote && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          onClick={() => !noteSent && setShowNote(false)}
        >
          <div className="absolute inset-0" style={{ background: "rgba(30,10,60,0.7)", backdropFilter: "blur(6px)" }} />
          <div
            className="modal-sheet w-full animate-slide-up relative"
            onClick={e => e.stopPropagation()}
          >
            {!noteSent ? (
              <>
                <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5" />
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center font-serif text-[20px] text-white shrink-0"
                    style={{ background: "linear-gradient(135deg, #E91E8C, #C2185B)" }}
                  >
                    V
                  </div>
                  <div>
                    <div className="font-sans font-bold text-[16px]" style={{ color: "#1a1820" }}>Pasează un bilet lui Vio</div>
                    <div className="font-sans text-[11px] mt-0.5" style={{ color: "#8e8e93" }}>poate fi citit live pe undă</div>
                  </div>
                </div>
                <textarea
                  className="note-textarea mb-2"
                  rows={4}
                  maxLength={240}
                  placeholder="o cerere, o gândire, o noapte albă..."
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  autoFocus
                />
                <div className="flex justify-between mb-5">
                  <span className="font-sans text-[12px]" style={{ color: "#8e8e93" }}>{noteText.length}/240</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowNote(false)}
                    className="flex-1 h-12 rounded-2xl font-sans text-[14px] font-medium"
                    style={{ background: "#f5f5f7", color: "#6e6e73", border: "1px solid #e5e5ea" }}
                  >
                    Renunță
                  </button>
                  <button
                    onClick={submitNote}
                    disabled={!noteText.trim()}
                    className="flex-1 h-12 rounded-2xl font-sans text-[14px] font-semibold text-white active:scale-[0.97] transition-transform disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg, #E91E8C, #C2185B)" }}
                  >
                    Trimite
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 animate-fade-in">
                <div
                  className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center font-serif text-[28px] text-white"
                  style={{ background: "linear-gradient(135deg, #E91E8C, #C2185B)" }}
                >
                  V
                </div>
                <div className="font-sans font-bold text-[20px] mb-1" style={{ color: "#1a1820" }}>Vio l-a primit.</div>
                <div className="font-sans text-[13px]" style={{ color: "#8e8e93" }}>Ascultă unda. Poate te strigă.</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
