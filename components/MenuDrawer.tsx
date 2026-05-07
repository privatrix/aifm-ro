"use client";
import { useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onNavigate: (target: "profile" | "favorites" | "notes" | "history" | "settings" | "help") => void;
  user?: { name: string; handle: string; avatarUrl?: string } | null;
  onSignIn?: () => void;
  onSignUp?: () => void;
  onSignOut?: () => void;
}

interface Item {
  id: "profile" | "favorites" | "notes" | "history" | "settings" | "help";
  label: string;
  hint?: string;
  icon: React.ReactNode;
}

const ITEMS: Item[] = [
  {
    id: "profile",
    label: "Profilul meu",
    hint: "nume, avatar, bio",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 21a8 8 0 0116 0"/>
      </svg>
    ),
  },
  {
    id: "favorites",
    label: "Piesele mele",
    hint: "favorite, votate",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
      </svg>
    ),
  },
  {
    id: "notes",
    label: "Biletele mele",
    hint: "trimise lui Vio",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
    ),
  },
  {
    id: "history",
    label: "Istoric ascultare",
    hint: "ce ai ascultat azi",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 7v5l3 2"/>
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Setări",
    hint: "notificări, limbă, temă",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 005 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 005 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 5a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09A1.65 1.65 0 0015 5a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
      </svg>
    ),
  },
  {
    id: "help",
    label: "Despre & Ajutor",
    hint: "contact, termeni",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/>
        <path d="M9.5 9a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 4"/>
        <circle cx="12" cy="17" r="0.6" fill="currentColor"/>
      </svg>
    ),
  },
];

export default function MenuDrawer({ open, onClose, onNavigate, user, onSignIn, onSignUp, onSignOut }: Props) {
  // ESC closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-[60] ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      {/* Scrim */}
      <div
        onClick={onClose}
        className="absolute inset-0 transition-opacity duration-200"
        style={{ background: "rgba(10,5,20,0.45)", backdropFilter: "blur(4px)", opacity: open ? 1 : 0 }}
      />

      {/* Drawer (white) */}
      <aside
        className="absolute top-0 left-0 h-full w-[86%] max-w-[340px] flex flex-col transition-transform duration-300"
        style={{
          background: "#ffffff",
          color: "#1a1820",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          boxShadow: "0 0 60px rgba(0,0,0,0.25)",
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        {/* Header / user card */}
        <div
          className="px-5 pt-5 pb-4 flex items-center gap-3"
          style={{ borderBottom: "1px solid #ececef" }}
        >
          {user ? (
            <>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center font-serif text-[20px] text-white shrink-0"
                style={{ background: "linear-gradient(135deg, #E91E8C, #C2185B)" }}
              >
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarUrl} alt="" className="w-full h-full rounded-2xl object-cover" />
                ) : user.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-sans font-bold text-[15px] truncate" style={{ color: "#1a1820" }}>{user.name}</div>
                <div className="font-sans text-[12px] truncate" style={{ color: "#8e8e93" }}>@{user.handle}</div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                style={{ color: "#8e8e93", background: "#f5f5f7" }}
                aria-label="Închide"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18"/>
                </svg>
              </button>
            </>
          ) : (
            <>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: "#FCE4EC", color: "#C2185B" }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M4 21a8 8 0 0116 0"/>
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-sans font-bold text-[15px]" style={{ color: "#1a1820" }}>Bun venit la AIFM</div>
                <div className="font-sans text-[12px]" style={{ color: "#8e8e93" }}>conectează-te ca să salvezi piese</div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                style={{ color: "#8e8e93", background: "#f5f5f7" }}
                aria-label="Închide"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18"/>
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Sign in / up CTAs when logged out */}
        {!user && (
          <div className="px-5 pt-4 pb-2 flex gap-2">
            <button
              onClick={() => { onSignIn?.(); }}
              className="flex-1 h-11 rounded-xl font-sans text-[13px] font-semibold text-white active:scale-[0.97] transition-transform"
              style={{ background: "linear-gradient(135deg, #E91E8C, #C2185B)" }}
            >
              Conectare
            </button>
            <button
              onClick={() => { onSignUp?.(); }}
              className="flex-1 h-11 rounded-xl font-sans text-[13px] font-semibold active:scale-[0.97] transition-transform"
              style={{ background: "#FCE4EC", color: "#C2185B" }}
            >
              Cont nou
            </button>
          </div>
        )}

        {/* Menu items */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="flex flex-col">
            {ITEMS.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => { onNavigate(item.id); onClose(); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left active:bg-pink-50 transition-colors"
                  style={{ color: "#1a1820" }}
                >
                  <span
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "#FCE4EC", color: "#C2185B" }}
                  >
                    {item.icon}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-sans font-semibold text-[14px]">{item.label}</span>
                    {item.hint && <span className="block font-sans text-[11px] mt-0.5" style={{ color: "#8e8e93" }}>{item.hint}</span>}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#c7c7cc" }}>
                    <path d="M9 6l6 6-6 6"/>
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div
          className="px-5 pt-2 pb-4"
          style={{ borderTop: "1px solid #ececef", paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
        >
          {user ? (
            <button
              onClick={() => { onSignOut?.(); }}
              className="w-full h-10 rounded-xl font-sans text-[13px] font-medium active:scale-[0.97] transition-transform"
              style={{ background: "#FCE4EC", color: "#C2185B" }}
            >
              Deconectare
            </button>
          ) : (
            <div className="text-center font-mono text-[10px] tracking-widest uppercase" style={{ color: "#c7c7cc" }}>
              AIFM · v0.1
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
