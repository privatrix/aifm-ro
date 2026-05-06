"use client";
import { useState } from "react";
import { SONGS } from "@/lib/data";
import Nav from "./Nav";
import RadioView from "./RadioView";
import LibraryView from "./LibraryView";
import TopView from "./TopView";
import NotesView from "./NotesView";

type Tab = "radio" | "biblioteca" | "top" | "bilete";

export default function App() {
  const [tab, setSongTab]       = useState<Tab>("radio");
  const [playing, setPlaying]   = useState(true);
  const [songIdx, setSongIdx]   = useState(0);
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteSent, setNoteSent] = useState(false);

  const [votes, setVotes] = useState<Record<number, number>>(
    () => Object.fromEntries(SONGS.map(s => [s.id, s.votes]))
  );
  const [voted, setVoted] = useState<Set<number>>(new Set());

  const currentSong = SONGS[songIdx];

  const toggleVote = (id: number) => {
    setVoted(prev => {
      const next     = new Set(prev);
      const wasVoted = next.has(id);
      wasVoted ? next.delete(id) : next.add(id);
      setVotes(v => ({ ...v, [id]: v[id] + (wasVoted ? -1 : 1) }));
      return next;
    });
  };

  const prevSong = () => setSongIdx(i => (i - 1 + SONGS.length) % SONGS.length);
  const nextSong = () => setSongIdx(i => (i + 1) % SONGS.length);
  const playSong = (idx: number) => { setSongIdx(idx); setSongTab("radio"); };

  const submitNote = () => {
    if (!noteText.trim()) return;
    setNoteSent(true);
    setTimeout(() => {
      setShowNote(false);
      setTimeout(() => { setNoteText(""); setNoteSent(false); }, 300);
    }, 1600);
  };

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: "#0d0620" }}>
      {/* ── Views ── */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        {tab === "radio" && (
          <RadioView
            song={currentSong}
            playing={playing}
            setPlaying={setPlaying}
            voted={voted.has(currentSong.id)}
            votes={votes[currentSong.id]}
            onVote={() => toggleVote(currentSong.id)}
            onPrev={prevSong}
            onNext={nextSong}
            onNote={() => setShowNote(true)}
          />
        )}
        {tab === "biblioteca" && (
          <LibraryView
            songs={SONGS}
            voted={voted}
            votes={votes}
            onVote={toggleVote}
            currentSong={currentSong}
            onPlay={playSong}
          />
        )}
        {tab === "top" && (
          <TopView
            songs={SONGS}
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
      <Nav active={tab} setActive={setSongTab} />

      {/* ── Note modal ── */}
      {showNote && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => !noteSent && setShowNote(false)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="note-modal relative w-full max-w-md rounded-3xl p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {!noteSent ? (
              <>
                {/* Vio avatar */}
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center font-serif text-xl text-white"
                    style={{ background: "linear-gradient(135deg, #E91E8C, #9C1458)" }}
                  >
                    V
                  </div>
                  <div>
                    <div className="font-serif text-lg text-white">Pasează un bilet</div>
                    <div className="font-mono text-[10px] text-muted tracking-wider">VIO ASCULTĂ</div>
                  </div>
                </div>

                <textarea
                  className="note-input mb-1"
                  rows={4}
                  maxLength={240}
                  placeholder="o cerere, o gândire, o noapte albă..."
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  autoFocus
                />
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[10px] text-dim">{noteText.length}/240</span>
                  <span className="font-mono text-[9px] text-dim">poate fi citit live pe undă</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowNote(false)}
                    className="flex-1 h-11 rounded-2xl font-sans text-sm text-white/60 transition-colors"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    Renunță
                  </button>
                  <button
                    onClick={submitNote}
                    disabled={!noteText.trim()}
                    className="flex-1 h-11 rounded-2xl font-sans text-sm text-white font-medium transition-all active:scale-97 disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg, #E91E8C, #9C1458)" }}
                  >
                    Trimite
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-6 animate-fade-in">
                <div
                  className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center font-serif text-2xl text-white"
                  style={{ background: "linear-gradient(135deg, #E91E8C, #9C1458)" }}
                >
                  V
                </div>
                <div className="font-serif text-2xl text-white mb-1">Vio l-a primit.</div>
                <div className="font-mono text-[11px] text-muted">Ascultă unda. Poate te strigă.</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
