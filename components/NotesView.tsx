"use client";
import { useState } from "react";
import { VIO_NOTES } from "@/lib/data";

interface Props {
  onNote: () => void;
}

export default function NotesView({ onNote }: Props) {
  const [tab, setTab] = useState<"citite" | "coada">("citite");

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Header */}
      <div className="view-header">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-serif text-[22px] text-white">Bilete</h1>
          <div className="tag text-muted">{VIO_NOTES.length} citite</div>
        </div>

        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "rgba(255,255,255,0.05)" }}>
          {([["citite", "Citite de Vio"], ["coada", "Coada mea"]] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="font-mono text-[10px] tracking-wider uppercase px-3 py-1 rounded-lg transition-all duration-150"
              style={{
                background: tab === id ? "linear-gradient(135deg, #E91E8C, #9C1458)" : "transparent",
                color: tab === id ? "#fff" : "rgba(255,255,255,0.45)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="view-scroll px-4 pt-4 pb-4 flex flex-col gap-3">
        {tab === "citite" ? (
          <>
            {VIO_NOTES.map((note, i) => (
              <div key={i} className="note-card animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] tracking-wider text-tungsten/80">— {note.from}</span>
                  <span className="font-mono text-[9px] text-dim">{note.time}</span>
                </div>
                <p className="font-serif text-[15px] text-white/80 italic leading-snug mb-2">&ldquo;{note.text}&rdquo;</p>
                {note.reply && (
                  <div
                    className="flex items-start gap-2.5 mt-3 pt-3"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <div
                      className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-serif text-[11px] text-white"
                      style={{ background: "linear-gradient(135deg, #E91E8C, #9C1458)" }}
                    >
                      V
                    </div>
                    <div>
                      <div className="font-mono text-[9px] text-tungsten/70 mb-0.5 tracking-wider uppercase">Vio a răspuns</div>
                      <p className="font-serif text-[14px] text-white/65 italic">{note.reply}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="text-center py-4 font-mono text-[10px] text-dim tracking-wider">
              BILETELE SUNT CITITE LIVE PE UNDĂ
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #E91E8C22, #9C145822)", border: "1px solid rgba(233,30,140,0.2)" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(233,30,140,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </div>
            <div>
              <p className="font-serif text-lg text-white/70 mb-1">Niciun bilet trimis.</p>
              <p className="font-mono text-[11px] text-dim">Trimite primul bilet lui Vio.</p>
            </div>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div
        className="shrink-0 px-5 py-4"
        style={{ background: "rgba(13,6,32,0.9)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <button
          onClick={onNote}
          className="w-full h-12 rounded-2xl font-sans text-sm font-medium text-white flex items-center justify-center gap-2 transition-all active:scale-98"
          style={{ background: "linear-gradient(135deg, #E91E8C, #9C1458)", boxShadow: "0 4px 20px rgba(233,30,140,0.35)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          Pasează un bilet lui Vio
        </button>
      </div>
    </div>
  );
}
