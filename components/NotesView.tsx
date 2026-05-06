"use client";
import { useState } from "react";
import { VIO_NOTES } from "@/lib/data";

interface Props {
  onNote: () => void;
}

export default function NotesView({ onNote }: Props) {
  const [tab, setTab] = useState<"citite" | "coada">("citite");

  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: "#3B1A60" }}>
      <div className="white-view">

        {/* Header */}
        <div className="white-header">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-sans font-bold text-[20px] text-ink">Bilete</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full animate-breathe" style={{ background: "#E91E8C" }} />
              <span className="font-sans text-[12px] text-gray-400">{VIO_NOTES.length} citite de Vio</span>
            </div>
          </div>
          <div className="flex gap-1 p-1 rounded-full w-fit" style={{ background: "#f5f5f5" }}>
            {([["citite", "Citite de Vio"], ["coada", "Coada mea"]] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="pill-btn"
                style={{
                  background: tab === id ? "linear-gradient(135deg, #E91E8C, #C2185B)" : "transparent",
                  color: tab === id ? "#fff" : "#888",
                  height: "30px",
                  padding: "0 14px",
                  fontSize: "12px",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="view-scroll px-4 pt-3 pb-4">
          {tab === "citite" ? (
            <div className="flex flex-col gap-3">
              {VIO_NOTES.map((note, i) => (
                <div
                  key={i}
                  className="rounded-2xl overflow-hidden"
                  style={{ border: "1px solid #f0f0f0" }}
                >
                  {/* Message */}
                  <div className="px-4 pt-4 pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-sans font-semibold text-[13px] text-ink">— {note.from}</span>
                      <span className="font-sans text-[11px] text-gray-400">{note.time}</span>
                    </div>
                    <p className="font-serif text-[15px] text-gray-600 italic leading-snug">&ldquo;{note.text}&rdquo;</p>
                  </div>

                  {/* Vio reply */}
                  {note.reply && (
                    <div className="px-4 pt-3 pb-4" style={{ background: "linear-gradient(135deg, #FCE4EC, #F8BBD0)" }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center font-serif text-[11px] text-white shrink-0"
                          style={{ background: "linear-gradient(135deg, #E91E8C, #C2185B)" }}
                        >
                          V
                        </div>
                        <span className="font-sans text-[11px] font-semibold tracking-wider uppercase" style={{ color: "#E91E8C" }}>
                          Vio a răspuns
                        </span>
                      </div>
                      <p className="font-serif text-[14px] italic leading-snug" style={{ color: "#C2185B" }}>{note.reply}</p>
                    </div>
                  )}
                </div>
              ))}
              <div className="text-center py-4 font-sans text-[11px] text-gray-300 tracking-wider">
                BILETELE SUNT CITITE LIVE PE UNDĂ
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div
                className="w-16 h-16 rounded-3xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #FCE4EC, #F8BBD0)" }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#E91E8C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
              </div>
              <div>
                <p className="font-sans font-semibold text-[16px] text-ink mb-1">Niciun bilet trimis.</p>
                <p className="font-sans text-[13px] text-gray-400">Trimite primul bilet lui Vio.</p>
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="shrink-0 px-4 py-3 border-t border-gray-50">
          <button
            onClick={onNote}
            className="w-full h-12 rounded-2xl font-sans text-[14px] font-semibold text-white flex items-center justify-center gap-2 active:scale-98 transition-transform"
            style={{ background: "linear-gradient(135deg, #E91E8C, #C2185B)", boxShadow: "0 4px 16px rgba(233,30,140,0.3)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            Pasează un bilet lui Vio
          </button>
        </div>
      </div>
    </div>
  );
}
