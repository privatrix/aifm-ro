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

  // 2. Poll /api/now every 5s while in live mode.
  //
  // The encoder fires its on_metadata callback the moment the next song
  // begins mixing in (start of the crossfade), but listeners hear the OLD
  // song dominate for ~1-2s afterwards. To keep the displayed title in
  // sync with what's audibly playing, we delay applying any *song change*
  // by a short visual debounce. Listener count etc. updates immediately.
  const TITLE_LAG_MS = 1500;
  useEffect(() => {
    if (!liveMode) return;
    let cancelled = false;
    let pendingTimer: ReturnType<typeof setTimeout> | null = null;
    const fetchNow = async () => {
      try {
        const r = await fetch("/api/now", { cache: "no-store" });
        if (!r.ok) return;
        const j = await r.json();
        if (cancelled || !j?.ok) return;
        const next = {
          current: j.current,
          startedAt: j.startedAt,
          elapsedSeconds: j.elapsedSeconds,
          serverNow: j.serverNow,
          upNext: j.upNext,
          live: !!j.live,
          lastHeartbeatAt: j.lastHeartbeatAt ?? null,
        };
        setNowPlaying(prev => {
          // First payload, or anything where the song id is the same: apply now.
          if (!prev || prev.current?.id === next.current?.id) {
            return next;
          }
          // Song change: schedule the swap to lag the audio crossfade.
          if (pendingTimer) clearTimeout(pendingTimer);
          pendingTimer = setTimeout(() => {
            if (!cancelled) setNowPlaying(next);
            pendingTimer = null;
          }, TITLE_LAG_MS);
          // Don't visually update yet — keep the old title until the timer fires.
          return prev;
        });
      } catch { /* network blip */ }
    };
    fetchNow();
    const t = setInterval(fetchNow, 5000);
    return () => {
      cancelled = true;
      if (pendingTimer) clearTimeout(pendingTimer);
      clearInterval(t);
    };
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

  /**
   * Live broadcast URL the current browser can decode. Computed once we have
   * an <audio> element so we can ask `canPlayType`. Memoised so we don't
   * resolve a new value on every render.
   */
  /** Track the active hls.js instance so we can tear it down on src changes. */
  const hlsRef = useRef<{ destroy: () => void } | null>(null);

  /**
   * Decide which live stream URL to use for this browser:
   *   1. NEXT_PUBLIC_STREAM_URL_HLS — chunked HLS (works on every browser,
   *      survives carrier-grade NATs, plays through hls.js or natively on
   *      Safari). Default if set.
   *   2. NEXT_PUBLIC_STREAM_URL_MP3 — Icecast MP3 mount.
   *   3. NEXT_PUBLIC_STREAM_URL    — Icecast Opus mount.
   *
   * Returns both the URL and a `kind` so the audio sync effect knows whether
   * it has to bring up hls.js for non-Safari browsers.
   */
  const resolveLiveUrl = useCallback((): { url: string; kind: "hls" | "mp3" | "opus" } => {
    const hls = process.env.NEXT_PUBLIC_STREAM_URL_HLS || "";
    const mp3 = process.env.NEXT_PUBLIC_STREAM_URL_MP3 || "";
    const opus = process.env.NEXT_PUBLIC_STREAM_URL || "";
    // Use HLS only on browsers that play it natively (iOS Safari).
    // Everywhere else, serve MP3 directly. hls.js on Android Chrome's
    // MediaSource has codec-compat quirks (ID3 PIDs, mp4a.40.2 in MPEG-TS)
    // that produce a silent "playing" element on some device/version combos.
    // MP3 over Icecast is a single, well-trodden path that just works.
    const isAppleNative = typeof document !== "undefined" && (() => {
      try {
        const probe = document.createElement("audio");
        return probe.canPlayType("application/vnd.apple.mpegurl") !== "";
      } catch { return false; }
    })();
    if (hls && isAppleNative) return { url: hls, kind: "hls" };
    if (mp3) return { url: mp3, kind: "mp3" };
    if (opus) return { url: opus, kind: "opus" };
    return { url: hls, kind: "hls" };
  }, []);

  // 4. Sync audio src.
  //
  // Live mode: point at the broadcast URL. HLS is preferred and uses hls.js
  // on browsers that don't natively support it (everything except Safari).
  // Solo mode: per-song fileUrl from the catalogue.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    // Tear down any previous hls.js attachment when src needs to change.
    const cleanupHls = () => {
      if (hlsRef.current) {
        try { hlsRef.current.destroy(); } catch {}
        hlsRef.current = null;
      }
    };

    if (liveMode) {
      const { url, kind } = resolveLiveUrl();
      if (!url) return;

      if (kind === "hls") {
        const safariNative = a.canPlayType("application/vnd.apple.mpegurl") !== "";
        if (safariNative) {
          cleanupHls();
          if (a.src !== url) {
            a.src = url;
            a.load();
          }
          // iOS Safari treats HLS as a seekable timeline: when the network
          // blips it pauses, buffers, then resumes at the same offset —
          // listeners drift further and further behind live. Detect stalls
          // (waiting/stalled events) and recovery (playing) and seek to the
          // live edge each time so the listener stays on the broadcast.
          const seekToLive = () => {
            try {
              const r = a.seekable;
              if (r && r.length > 0) {
                const liveEdge = r.end(r.length - 1);
                // Stay 2s behind the very edge to keep a small buffer.
                const target = Math.max(liveEdge - 2, 0);
                if (target > a.currentTime + 1.5) {
                  a.currentTime = target;
                }
              }
            } catch {}
          };
          a.addEventListener("loadedmetadata", seekToLive);
          a.addEventListener("playing", seekToLive);
          a.addEventListener("waiting", seekToLive);
          a.addEventListener("stalled", seekToLive);
          // Also re-seek every 30s in case neither event fires after drift.
          const t = setInterval(seekToLive, 30000);
          // Stash cleanup handle as a fake "hlsRef" so the next src-change can
          // dispose it.
          hlsRef.current = {
            destroy: () => {
              clearInterval(t);
              a.removeEventListener("loadedmetadata", seekToLive);
              a.removeEventListener("playing", seekToLive);
              a.removeEventListener("waiting", seekToLive);
              a.removeEventListener("stalled", seekToLive);
            },
          };
          return;
        }
        // Non-Safari: use hls.js. Lazy-load to keep the bundle small.
        cleanupHls();
        // Clear any existing src so the audio element doesn't try to play it.
        if (a.src && a.src !== "") { a.removeAttribute("src"); a.load(); }
        const fallbackToMp3 = (reason: string) => {
          const mp3 = process.env.NEXT_PUBLIC_STREAM_URL_MP3 || "";
          console.warn("[audio] HLS failed, falling back to MP3:", reason);
          if (!mp3) return;
          if (hlsRef.current) {
            try { hlsRef.current.destroy(); } catch {}
            hlsRef.current = null;
          }
          if (a.src !== mp3) {
            a.src = mp3;
            a.load();
          }
        };
        void import("hls.js").then(({ default: Hls }) => {
          if (!Hls.isSupported()) {
            fallbackToMp3("hls.js not supported");
            return;
          }
          // Generous client-side buffer so transient mobile-network jitter
          // (especially on roaming) can't underrun the player.
          // - maxBufferLength: how much audio to keep buffered ahead
          // - maxMaxBufferLength: hard ceiling
          // - liveSyncDurationCount: how many segments to stay behind live edge
          //   (3 = ~6s on 2s segments; safe against jitter, still feels live)
          const hls = new Hls({
            lowLatencyMode: false,
            backBufferLength: 0,
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
            liveSyncDurationCount: 3,
            liveMaxLatencyDurationCount: 10,
            // Aggressive recovery from network blips.
            fragLoadingMaxRetry: 6,
            manifestLoadingMaxRetry: 6,
            levelLoadingMaxRetry: 6,
          });
          // Fall back to MP3 on any fatal HLS error. hls.js can recover from
          // most transient blips on its own, but if recovery fails (or the
          // platform's MediaSource implementation rejects the segments — the
          // exact failure mode some Android Chrome builds hit), we need an
          // alternative source so the user gets audio.
          hls.on(Hls.Events.ERROR, (_e: unknown, data: { fatal?: boolean; type?: string; details?: string }) => {
            if (!data?.fatal) return;
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              try { hls.startLoad(); return; } catch {}
            }
            if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              try { hls.recoverMediaError(); return; } catch {}
            }
            fallbackToMp3(`fatal ${data.type ?? "?"}/${data.details ?? "?"}`);
          });
          hls.loadSource(url);
          hls.attachMedia(a);
          hlsRef.current = hls;
        }).catch(err => {
          fallbackToMp3(`hls.js import: ${err?.message ?? err}`);
        });
        return;
      }

      // mp3 / opus: simple <audio src=…>
      cleanupHls();
      if (a.src !== url) {
        a.src = url;
        a.load();
      }
      return;
    }

    // Solo mode.
    cleanupHls();
    if (!currentSong?.fileUrl) return;
    if (a.src === currentSong.fileUrl) return;
    a.src = currentSong.fileUrl;
    a.load();
  }, [currentSong?.id, currentSong?.fileUrl, liveMode, nowPlaying?.startedAt, resolveLiveUrl]);

  // 5. Play/pause based on `playing`.
  //
  // Both live and solo modes use real <audio> play/pause. iOS Safari requires
  // play() to be called within a user gesture stack, which we get because
  // setPlaying(true) is fired from a click handler. We don't try to keep the
  // stream running while "paused" — iOS would mute it anyway and fight us
  // with its lock-screen / Now Playing UI.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    a.muted = false;
    if (playing) {
      const p = a.play();
      if (p && typeof p.catch === "function") {
        p.catch((err) => {
          console.warn("[audio] play() rejected:", err?.name, err?.message);
          // Only flip the UI to paused if the rejection was due to lack of
          // user gesture (NotAllowedError). For NotSupportedError or aborts,
          // keep "playing" intent set so hls.js / MP3 fallback can take over
          // and the audio element will start playing once it has a source.
          if (err?.name === "NotAllowedError") {
            setPlaying(false);
          }
        });
      }
      // Log audio element errors but DO NOT auto-pause the UI. hls.js performs
      // its own recovery (and we have an MP3 fallback wired into its error
      // handler), so flipping the UI to pause on the first transient error
      // event makes the button bounce back to pause before audio actually
      // arrives — the bug some Android browsers hit.
      const onError = () => {
        const e = a.error;
        console.warn("[audio] element error:", e?.code, e?.message);
      };
      a.addEventListener("error", onError, { once: true });
      const onStalled = () => console.warn("[audio] stalled (network slowed)");
      a.addEventListener("stalled", onStalled, { once: true });
    } else {
      a.pause();
      // For live mode, also reload to drop the buffered tail so next play()
      // starts from the live edge. Without this, the user resumes seconds
      // behind broadcast.
      if (liveMode) {
        try { a.load(); } catch {}
      }
    }
  }, [playing, liveMode, currentSong?.id, currentSong?.fileUrl]);

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
    return <div className="app-shell flex items-center justify-center text-bone/60 font-mono text-sm">Se încarcă…</div>;
  }

  return (
    <div className="app-shell flex flex-col">
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        onPlay={() => setPlaying(true)}
        onPause={(e) => {
          // Only reflect pauses that came from the user (or the play() promise
          // rejected). Some Android browsers + hls.js fire spurious `pause`
          // events while attaching the MediaSource — BEFORE any audio ever
          // played. Treating those as "user paused" causes the play button to
          // flip back to pause instantly. We detect this by checking whether
          // the element ever produced any audio (currentTime > 0). If it has
          // never started, ignore the pause event.
          const a = e.currentTarget as HTMLAudioElement;
          if (a.currentTime > 0 || a.played?.length) {
            setPlaying(false);
          }
        }}
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
