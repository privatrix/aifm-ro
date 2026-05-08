"use client";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { SONGS as MOCK_SONGS, type Song } from "@/lib/data";
import Nav from "./Nav";
import RadioView from "./RadioView";
import LibraryView from "./LibraryView";
import NotesView from "./NotesView";
import MenuDrawer from "./MenuDrawer";
import ProfileView from "./ProfileView";
import ProfileDetailView, { type DetailMode } from "./ProfileDetailView";
import AuthSheet, { type AuthMode, type AuthUser } from "./AuthSheet";
import ChangePasswordSheet from "./ChangePasswordSheet";
import PrivacySheet from "./PrivacySheet";
import { useLiveAudio } from "./useLiveAudio";

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

  // ---- Auth + profile state ----
  // We hydrate `me` once on mount via /api/me. Null = signed out (or check
  // hasn't completed yet; we don't differentiate in the UI because the
  // signed-out state is the default and the sign-in CTA is harmless to show).
  const [me, setMe] = useState<AuthUser | null>(null);
  const [stats, setStats] = useState({ favorites: 0, notes: 0, hoursListened: 0 });
  const [authMode, setAuthMode] = useState<AuthMode>("off");
  const [profileDetail, setProfileDetail] = useState<DetailMode | null>(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  // Set of song ids the signed-in user has favorited. Drives the heart icon
  // throughout the UI in addition to the existing anonymous vote toggle.
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  // On-screen debug overlay — visible only with ?debug=1 in the URL.
  // Useful for diagnosing mobile-only audio bugs without DevTools.
  const [debugLines, setDebugLines] = useState<string[]>([]);
  const debugEnabled = typeof window !== "undefined"
    && window.location.search.includes("debug=1");
  const dlog = useCallback((msg: string) => {
    if (!debugEnabled) return;
    setDebugLines(prev => {
      const stamped = `${new Date().toISOString().slice(11, 23)} ${msg}`;
      const next = [...prev, stamped];
      return next.length > 30 ? next.slice(-30) : next;
    });
  }, [debugEnabled]);

  // 0. Hydrate the current user from the session cookie. We also fetch the
  //    user's favorites so the heart icon reflects their account state from
  //    the first paint after sign-in.
  const refreshMe = useCallback(async () => {
    try {
      const r = await fetch("/api/me", { cache: "no-store" });
      if (r.status === 401) { setMe(null); setFavorites(new Set()); return; }
      const j = await r.json();
      if (j?.ok) {
        setMe(j.user as AuthUser);
        setStats(j.stats ?? { favorites: 0, notes: 0, hoursListened: 0 });
      }
    } catch { /* offline; treat as signed-out */ }
  }, []);
  const refreshFavorites = useCallback(async () => {
    try {
      const r = await fetch("/api/me/favorites", { cache: "no-store" });
      if (!r.ok) return;
      const j = await r.json();
      if (j?.ok) setFavorites(new Set((j.favorites as { id: number }[]).map(f => f.id)));
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);
  useEffect(() => {
    if (me) void refreshFavorites();
    else setFavorites(new Set());
  }, [me, refreshFavorites]);

  // Toggle favorite on a song. For signed-out users we fall back to opening
  // the auth sheet so the action has a meaningful next step.
  const toggleFavorite = useCallback(async (songId: number) => {
    if (!me) { setAuthMode("signup"); return; }
    const wasFav = favorites.has(songId);
    // Optimistic UI update.
    setFavorites(prev => {
      const next = new Set(prev);
      wasFav ? next.delete(songId) : next.add(songId);
      return next;
    });
    try {
      const res = await fetch(`/api/me/favorites/${songId}`, {
        method: wasFav ? "DELETE" : "POST",
        cache: "no-store",
      });
      const j = await res.json().catch(() => ({}));
      if (j?.ok) {
        // Reconcile with server.
        setStats(s => ({ ...s, favorites: j.count ?? s.favorites }));
      } else {
        // Revert.
        setFavorites(prev => {
          const next = new Set(prev);
          wasFav ? next.add(songId) : next.delete(songId);
          return next;
        });
      }
    } catch {
      setFavorites(prev => {
        const next = new Set(prev);
        wasFav ? next.add(songId) : next.delete(songId);
        return next;
      });
    }
  }, [favorites, me]);

  const onAuthSuccess = useCallback((user: AuthUser) => {
    setMe(user);
    setAuthMode("off");
    void refreshMe();
    void refreshFavorites();
  }, [refreshMe, refreshFavorites]);

  const signOut = useCallback(async () => {
    try { await fetch("/api/auth/signout", { method: "POST", cache: "no-store" }); }
    catch { /* ignore */ }
    setMe(null);
    setFavorites(new Set());
    setStats({ favorites: 0, notes: 0, hoursListened: 0 });
    setProfileDetail(null);
  }, []);

  const saveProfile = useCallback(async (patch: Partial<{ name: string; bio: string; city: string }>) => {
    if (!me) return;
    const body = {
      displayName: patch.name,
      bio: patch.bio,
      city: patch.city,
    };
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      if (res.ok) {
        setMe({
          ...me,
          displayName: patch.name ?? me.displayName,
          bio: patch.bio ?? me.bio,
          city: patch.city ?? me.city,
        });
      }
    } catch { /* ignore */ }
  }, [me]);

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

  // Live broadcast source URLs. The hook picks the right one for the browser.
  const liveUrls = useMemo(() => ({
    hls:  process.env.NEXT_PUBLIC_STREAM_URL_HLS || "",
    mp3:  process.env.NEXT_PUBLIC_STREAM_URL_MP3 || "",
    opus: process.env.NEXT_PUBLIC_STREAM_URL || "",
  }), []);

  // Wire the audio element to live mode. The hook owns: source URL pick,
  // play()/pause(), and HLS live-edge tracking. It does NOT own onPlay/onPause
  // events on the element — those flow through the JSX handlers below so the
  // mapping from "audio element state" to "playing UI state" stays explicit
  // and visible.
  useLiveAudio({
    audioRef,
    enabled: liveMode,
    playing,
    urls: liveUrls,
    soloSrc: liveMode ? undefined : (currentSong?.fileUrl ?? undefined),
    onPlayFail: () => setPlaying(false),
    onDebug: dlog,
  });

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
    // For signed-in users: a vote is also a personal favorite. Mirror the
    // vote state into favorites so the profile's "Piesele mele favorite"
    // list reflects what the user actually liked.
    if (me) {
      void toggleFavorite(id).catch(() => { /* favorite reconciliation is best-effort */ });
    }
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
  }, [voted, me, toggleFavorite]);

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
    // POST to backend. For signed-in users this binds the note to their
    // account; Vio's reply will appear in the bilete tab once the cron tick
    // (max 2 min) processes it.
    void fetch("/api/notes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: noteText.trim() }),
    }).then(r => {
      if (r.ok && me) {
        // Optimistic stats bump so the profile counter feels immediate.
        setStats(s => ({ ...s, notes: s.notes + 1 }));
      }
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
      {debugEnabled && (
        <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:9999,maxHeight:"40vh",overflow:"auto",background:"rgba(0,0,0,0.85)",color:"#0f0",fontFamily:"monospace",fontSize:10,padding:6,lineHeight:1.3}}>
          {debugLines.map((l,i) => <div key={i}>{l}</div>)}
        </div>
      )}
      {/*
        Audio element. The mapping from element state -> UI state is honest:
          - onPlay  : the element actually started playing -> reflect playing
          - onPause : the element actually paused -> reflect paused, BUT only
                     if audio had ever played (some browsers fire a spurious
                     pause during src reattach before any sound has come out;
                     we detect this via currentTime/played and ignore it).
          - onEnded : in solo mode, advance; in live mode the server already
                     has, so refetch /api/now.
        play()/pause() calls are driven by useLiveAudio (live) and the
        solo-source effect above; we don't call them from inside these
        handlers.
      */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        onPlay={() => { dlog("el onPlay"); setPlaying(true); }}
        onPause={(e) => {
          const a = e.currentTarget as HTMLAudioElement;
          dlog(`el onPause ct=${a.currentTime.toFixed(2)} played=${a.played?.length ?? 0}`);
          if (a.currentTime > 0 || a.played?.length) setPlaying(false);
        }}
        onPlaying={(e) => dlog(`el playing ct=${(e.currentTarget as HTMLAudioElement).currentTime.toFixed(2)}`)}
        onCanPlay={(e) => dlog(`el canplay rs=${(e.currentTarget as HTMLAudioElement).readyState}`)}
        onError={(e) => {
          const err = (e.currentTarget as HTMLAudioElement).error;
          dlog(`el error code=${err?.code} msg=${err?.message ?? ""}`);
        }}
        onStalled={() => dlog("el stalled")}
        preload="auto"
        playsInline
        // No crossOrigin: we don't read audio samples or render to canvas;
        // setting crossOrigin="anonymous" forces CORS mode and can refuse
        // playback on browsers that are strict about response headers.
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
        {tab === "profile" && profileDetail && (
          <ProfileDetailView
            mode={profileDetail}
            onBack={() => setProfileDetail(null)}
            onPlaySong={(songId) => {
              const idx = songs.findIndex(s => s.id === songId);
              if (idx >= 0) { playSongInline(idx); setProfileDetail(null); setTab("radio"); }
            }}
          />
        )}
        {tab === "profile" && !profileDetail && (
          <ProfileView
            user={me ? {
              name: me.displayName,
              handle: me.handle,
              bio: me.bio,
              city: me.city,
              avatarUrl: me.avatarUrl ?? undefined,
              joinedAt: me ? formatJoined(me) : undefined,
            } : null}
            stats={stats}
            onSignIn={() => setAuthMode("signin")}
            onSignUp={() => setAuthMode("signup")}
            onSignOut={signOut}
            onSave={saveProfile}
            onOpenFavorites={() => setProfileDetail("favorites")}
            onOpenNotes={() => setProfileDetail("notes")}
            onOpenHistory={() => setProfileDetail("history")}
            onChangePassword={() => setChangePasswordOpen(true)}
            onOpenPrivacy={() => setPrivacyOpen(true)}
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

      <AuthSheet
        mode={authMode}
        onClose={() => setAuthMode("off")}
        onSuccess={onAuthSuccess}
        onSwitchMode={(m) => setAuthMode(m)}
      />
      <ChangePasswordSheet
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
      <PrivacySheet
        open={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
        onAccountDeleted={() => {
          // Account is gone; clear local state to mirror what /api/auth/signout would have done.
          setMe(null);
          setFavorites(new Set());
          setStats({ favorites: 0, notes: 0, hoursListened: 0 });
          setProfileDetail(null);
        }}
      />
    </div>
  );
}

function formatJoined(me: AuthUser): string | undefined {
  // ProfileView shows "din <text>" — we render the year of account creation.
  // The createdAt comes from the API as an ISO string; if absent, omit the field.
  const raw = (me as unknown as { createdAt?: string }).createdAt;
  if (!raw) return undefined;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString("ro-RO", { month: "short", year: "numeric" });
}
