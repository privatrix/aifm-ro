"use client";
import { useState } from "react";

interface Stats {
  favorites: number;
  notes: number;
  hoursListened: number;
}

interface User {
  name: string;
  handle: string;
  bio: string;
  avatarUrl?: string;
  city?: string;
  joinedAt?: string;
}

interface Props {
  user?: User | null;
  stats?: Stats;
  onSignIn?: () => void;
  onSignUp?: () => void;
  onSignOut?: () => void;
  onSave?: (patch: Partial<User>) => void;
}

const DEFAULT_STATS: Stats = { favorites: 0, notes: 0, hoursListened: 0 };

export default function ProfileView({
  user, stats = DEFAULT_STATS, onSignIn, onSignUp, onSignOut, onSave,
}: Props) {

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [city, setCity] = useState(user?.city ?? "");

  // ── Logged-out state ─────────────────────────────
  if (!user) {
    return (
      <div className="absolute inset-0 flex flex-col">
        {/* Top hero */}
        <div
          className="px-6 pt-8 pb-10 flex flex-col items-center text-center"
          style={{ background: "linear-gradient(160deg, #E91E8C, #C2185B)" }}
        >
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
            style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.25)" }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 21a8 8 0 0116 0"/>
            </svg>
          </div>
          <div className="text-white font-sans font-bold text-[22px]">Profilul tău</div>
          <div className="text-white/80 font-sans text-[13px] mt-2 max-w-[280px]">
            Salvează piese, trimite bilete cu numele tău, urmărește ce ai ascultat.
          </div>
        </div>

        {/* CTAs + perks */}
        <div className="flex-1 bg-white px-5 pt-6 pb-8 overflow-y-auto">
          <div className="flex flex-col gap-3">
            <button
              onClick={onSignUp}
              className="w-full h-12 rounded-2xl font-sans text-[14px] font-semibold text-white active:scale-[0.97] transition-transform"
              style={{ background: "linear-gradient(135deg, #E91E8C, #C2185B)" }}
            >
              Creează cont
            </button>
            <button
              onClick={onSignIn}
              className="w-full h-12 rounded-2xl font-sans text-[14px] font-semibold active:scale-[0.97] transition-transform"
              style={{ background: "#FCE4EC", color: "#C2185B" }}
            >
              Am deja cont
            </button>
          </div>

          <div className="mt-7">
            <div className="font-mono text-[10px] tracking-widest uppercase text-[#8e8e93] mb-3">de ce un cont</div>
            <ul className="flex flex-col gap-3">
              {[
                { t: "Piesele tale", h: "salvate, votate, oricând la îndemână" },
                { t: "Biletele tale", h: "Vio știe că tu i-ai scris" },
                { t: "Istoric", h: "ce ai ascultat și când" },
                { t: "Sincronizare", h: "telefon și browser, același cont" },
              ].map(p => (
                <li key={p.t} className="flex items-start gap-3">
                  <span className="w-2 h-2 mt-2 rounded-full" style={{ background: "#E91E8C" }} />
                  <div>
                    <div className="font-sans font-semibold text-[14px]" style={{ color: "#1a1820" }}>{p.t}</div>
                    <div className="font-sans text-[12px]" style={{ color: "#6e6e73" }}>{p.h}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // ── Logged-in state ──────────────────────────────
  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Top: avatar + identity */}
      <div
        className="px-6 pt-7 pb-7 flex flex-col items-center text-center relative"
        style={{ background: "linear-gradient(160deg, #E91E8C, #C2185B)" }}
      >
        <button
          onClick={() => setEditing(e => !e)}
          className="absolute top-5 right-5 w-9 h-9 rounded-xl flex items-center justify-center text-white/85 active:scale-90 transition-transform"
          style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.20)" }}
          aria-label={editing ? "Renunță" : "Editează"}
        >
          {editing ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.12 2.12 0 113 3L7 19l-4 1 1-4z"/>
            </svg>
          )}
        </button>

        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center font-serif text-[40px] text-white mb-3"
          style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.30)" }}
        >
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt="" className="w-full h-full rounded-3xl object-cover" />
          ) : user.name.slice(0, 1).toUpperCase()}
        </div>

        {!editing ? (
          <>
            <div className="text-white font-sans font-bold text-[20px]">{user.name}</div>
            <div className="text-white/75 font-sans text-[12px] mt-0.5">@{user.handle}</div>
            {user.bio && (
              <p className="text-white/85 font-serif italic text-[14px] mt-3 max-w-[300px]">
                &ldquo;{user.bio}&rdquo;
              </p>
            )}
            {(user.city || user.joinedAt) && (
              <div className="flex items-center gap-3 mt-3 text-white/70 font-mono text-[10px] tracking-wider uppercase">
                {user.city && <span>📍 {user.city}</span>}
                {user.joinedAt && <span>· din {user.joinedAt}</span>}
              </div>
            )}
          </>
        ) : (
          <div className="w-full max-w-[300px] flex flex-col gap-2 mt-1">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nume"
              className="w-full px-3 py-2 rounded-xl font-sans text-[14px] text-white"
              style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)" }}
            />
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Oraș"
              className="w-full px-3 py-2 rounded-xl font-sans text-[13px] text-white"
              style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)" }}
            />
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="o gândire scurtă despre tine"
              rows={2}
              className="w-full px-3 py-2 rounded-xl font-serif italic text-[13px] text-white resize-none"
              style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)" }}
              maxLength={120}
            />
            <button
              onClick={() => { onSave?.({ name, bio, city }); setEditing(false); }}
              className="w-full h-11 rounded-xl font-sans text-[13px] font-semibold mt-1 active:scale-[0.97] transition-transform"
              style={{ background: "white", color: "#C2185B" }}
            >
              Salvează
            </button>
          </div>
        )}
      </div>

      {/* Bottom: stats + sections + sign out */}
      <div className="flex-1 bg-white overflow-y-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 px-5 pt-5">
          {[
            { v: stats.favorites, l: "favorite" },
            { v: stats.notes, l: "bilete" },
            { v: stats.hoursListened, l: "ore" },
          ].map(s => (
            <div key={s.l} className="rounded-2xl py-3 text-center" style={{ background: "#FCE4EC" }}>
              <div className="font-sans font-bold text-[20px]" style={{ color: "#C2185B" }}>{s.v}</div>
              <div className="font-mono text-[10px] tracking-widest uppercase mt-0.5" style={{ color: "#8e8e93" }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Sections */}
        <div className="px-5 pt-6 pb-2">
          <div className="font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: "#8e8e93" }}>cont</div>
          <ul className="flex flex-col gap-1">
            {[
              { l: "Piesele mele favorite", h: `${stats.favorites} salvate` },
              { l: "Biletele mele", h: `${stats.notes} trimise` },
              { l: "Istoric ascultare", h: "ultimele 30 zile" },
            ].map(row => (
              <li key={row.l}>
                <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left active:bg-pink-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="font-sans font-semibold text-[14px]" style={{ color: "#1a1820" }}>{row.l}</div>
                    <div className="font-sans text-[11px]" style={{ color: "#8e8e93" }}>{row.h}</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#c7c7cc" }}>
                    <path d="M9 6l6 6-6 6"/>
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="px-5 pt-4 pb-2">
          <div className="font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: "#8e8e93" }}>setări</div>
          <ul className="flex flex-col gap-1">
            {[
              { l: "Notificări", h: "când Vio îți citește biletul" },
              { l: "Limbă", h: "Română" },
              { l: "Temă", h: "automată" },
              { l: "Confidențialitate", h: "datele tale" },
            ].map(row => (
              <li key={row.l}>
                <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left active:bg-pink-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="font-sans font-semibold text-[14px]" style={{ color: "#1a1820" }}>{row.l}</div>
                    <div className="font-sans text-[11px]" style={{ color: "#8e8e93" }}>{row.h}</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#c7c7cc" }}>
                    <path d="M9 6l6 6-6 6"/>
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="px-5 pt-4 pb-8">
          <button
            onClick={onSignOut}
            className="w-full h-11 rounded-2xl font-sans text-[13px] font-medium active:scale-[0.97] transition-transform"
            style={{ background: "#FCE4EC", color: "#C2185B" }}
          >
            Deconectare
          </button>
        </div>
      </div>
    </div>
  );
}
