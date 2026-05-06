"use client";
import { useEffect, useState } from "react";
import { SONGS as MOCK_SONGS, type Song } from "@/lib/data";
import Nav from "./Nav";
import RadioView from "./RadioView";
import LibraryView from "./LibraryView";
import TopView from "./TopView";
import NotesView from "./NotesView";

type Tab = "radio" | "biblioteca" | "top" | "bilete";

export default function App() {
  const [tab, setTab]           = useState<Tab>("radio");
  const [playing, setPlaying]   = useState(true);
  const [songIdx, setSongIdx]   = useState(0);
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteSent, setNoteSent] = useState(false);
  const [songs, setSongs] = useState<Song[]>(MOCK_SONGS);
  const [votes, setVotes] = useState<Record<number, number>>(
    () => Object.fromEntries(MOCK_SONGS.map(s => [s.id, s.votes]))
  );
  const [voted, setVoted] = useState<Set<number>>(new Set());

  // Pull live songs from /api/songs. If the API has any rows, use them.
  // Otherwise we keep the mock data so the page never feels broken.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/songs", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled || !j?.ok || !Array.isArray(j.songs) || j.songs.length === 0) return;
        setSongs(j.songs as Song[]);
        setSongIdx(0);
        setVotes(Object.fromEntries((j.songs as Song[]).map((s) => [s.id, s.votes])));
      })
      .catch(() => { /* keep mock fallback */ });
    return () => { cancelled = true; };
  }, []);

  const currentSong = songs[songIdx] ?? songs[0];

  const toggleVote = (id: number) => {
    setVoted(prev => {
      const next     = new Set(prev);
      const wasVoted = next.has(id);
      wasVoted ? next.delete(id) : next.add(id);
      setVotes(v => ({ ...v, [id]: v[id] + (wasVoted ? -1 : 1) }));
      return next;
    });
  };

  const prevSong = () => setSongIdx(i => (i - 1 + songs.length) % songs.length);
  const nextSong = () => setSongIdx(i => (i + 1) % songs.length);
  const playSong = (idx: number) => { setSongIdx(idx); setTab("radio"); };

  const submitNote = () => {
    if (!noteText.trim()) return;
    // Persist to local queue so "Coada mea" survives a refresh.
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
    setNoteSent(true);
    setTimeout(() => {
      setShowNote(false);
      setTimeout(() => { setNoteText(""); setNoteSent(false); }, 300);
    }, 1600);
  };

  return (
    <div className="fixed inset-0 flex flex-col">

      {/* ── Views ── */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        {tab === "radio" && (
          <RadioView
            song={currentSong}
            songs={songs}
            playing={playing}
            setPlaying={setPlaying}
            voted={voted.has(currentSong.id)}
            votes={votes[currentSong.id]}
            onVote={() => toggleVote(currentSong.id)}
            onPrev={prevSong}
            onNext={nextSong}
            onNote={() => setShowNote(true)}
            onOpenLibrary={() => setTab("biblioteca")}
          />
        )}
        {tab === "biblioteca" && (
          <LibraryView
            songs={songs}
            voted={voted}
            votes={votes}
            onVote={toggleVote}
            currentSong={currentSong}
            onPlay={playSong}
            onBack={() => setTab("radio")}
          />
        )}
        {tab === "top" && (
          <TopView
            songs={songs}
            voted={voted}
            votes={votes}
            onVote={toggleVote}
            currentSong={currentSong}
            onPlay={playSong}
          />
        )}
        {tab === "bilete" && (
          <NotesView onNote={() => setShowNote(true)} />
        )}
      </div>

      {/* ── Navigation ── */}
      <Nav active={tab} setActive={setTab} />

      {/* ── Note modal (white bottom sheet) ── */}
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
                {/* Handle bar */}
                <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5" />

                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center font-serif text-[20px] text-white shrink-0"
                    style={{ background: "linear-gradient(135deg, #E91E8C, #C2185B)" }}
                  >
                    V
                  </div>
                  <div>
                    <div className="font-sans font-bold text-[16px] text-ink">Pasează un bilet lui Vio</div>
                    <div className="font-sans text-[11px] text-gray-400 mt-0.5">poate fi citit live pe undă</div>
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
                  <span className="font-sans text-[12px] text-gray-400">{noteText.length}/240</span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowNote(false)}
                    className="flex-1 h-12 rounded-2xl font-sans text-[14px] font-medium text-gray-500"
                    style={{ background: "#f5f5f5" }}
                  >
                    Renunță
                  </button>
                  <button
                    onClick={submitNote}
                    disabled={!noteText.trim()}
                    className="flex-1 h-12 rounded-2xl font-sans text-[14px] font-semibold text-white active:scale-97 transition-transform disabled:opacity-40"
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
                <div className="font-sans font-bold text-[20px] text-ink mb-1">Vio l-a primit.</div>
                <div className="font-sans text-[13px] text-gray-400">Ascultă unda. Poate te strigă.</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
