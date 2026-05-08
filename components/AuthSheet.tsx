"use client";
/**
 * Sign-in / sign-up bottom sheet.
 *
 * One component, two modes (toggled with the link at the bottom). Keeps state
 * local; the parent only deals with `mode` (off | signin | signup) and a
 * success callback that receives the new `User`.
 *
 * Visual: slides up from the bottom of the viewport, covers ~80% of height.
 * Matches the existing modal pattern (NotesView etc.) — pink hero on top,
 * white body, big primary CTA.
 */
import { useEffect, useRef, useState } from "react";

export interface AuthUser {
  id: number;
  email: string;
  displayName: string;
  handle: string;
  bio: string;
  city: string;
  avatarUrl: string | null;
}

export type AuthMode = "off" | "signin" | "signup";

interface Props {
  mode: AuthMode;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
  onSwitchMode: (m: AuthMode) => void;
}

export default function AuthSheet({ mode, onClose, onSuccess, onSwitchMode }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const firstInput = useRef<HTMLInputElement | null>(null);

  // Reset state when the sheet opens.
  useEffect(() => {
    if (mode !== "off") {
      setError("");
      setBusy(false);
      // Focus a moment after the sheet finishes its slide-up animation so the
      // keyboard doesn't jump in mid-transition on iOS.
      const t = setTimeout(() => firstInput.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [mode]);

  if (mode === "off") return null;

  const isSignup = mode === "signup";

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const url = isSignup ? "/api/auth/signup" : "/api/auth/signin";
      const body: Record<string, string> = { email, password };
      if (isSignup) {
        body.displayName = displayName;
        body.handle = handle;
      }
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) {
        setError(j?.error ?? "Ceva nu a mers. Încearcă din nou.");
        setBusy(false);
        return;
      }
      onSuccess(j.user as AuthUser);
    } catch {
      setError("Conexiune eșuată. Încearcă din nou.");
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full bg-white rounded-t-3xl flex flex-col"
        style={{ maxHeight: "92dvh", animation: "auth-sheet-up 280ms cubic-bezier(.2,.8,.2,1)" }}
      >
        {/* Hero */}
        <div
          className="px-6 pt-7 pb-6 rounded-t-3xl"
          style={{ background: "linear-gradient(160deg, #E91E8C, #C2185B)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/70">AIFM</span>
            <button
              onClick={onClose}
              aria-label="Închide"
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/85 active:scale-90 transition-transform"
              style={{ background: "rgba(255,255,255,0.14)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <h2 className="text-white font-sans font-bold text-[22px]">
            {isSignup ? "Creează contul tău" : "Bun venit înapoi"}
          </h2>
          <p className="text-white/80 font-sans text-[13px] mt-1.5 max-w-[300px]">
            {isSignup
              ? "Salvează piese, trimite bilete cu numele tău, păstrează istoricul."
              : "Conectează-te ca să-ți regăsești piesele și biletele."}
          </p>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 pt-5 pb-7">
          <div className="flex flex-col gap-3">
            {isSignup && (
              <>
                <Field label="Nume" >
                  <input
                    ref={firstInput}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Cum te chemi?"
                    autoComplete="name"
                    maxLength={40}
                    className="auth-input"
                  />
                </Field>
                <Field label="Handle" hint="literele tale, fără spații">
                  <div className="flex items-center" style={{ background: "#f5f5f7", border: "1px solid #e5e5ea", borderRadius: 12 }}>
                    <span className="pl-3 pr-1 font-mono text-[14px]" style={{ color: "#8e8e93" }}>@</span>
                    <input
                      value={handle}
                      onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase())}
                      placeholder="alex"
                      autoComplete="username"
                      maxLength={20}
                      className="flex-1 bg-transparent py-2.5 pr-3 outline-none font-sans text-[14px]"
                      style={{ color: "#1a1820" }}
                    />
                  </div>
                </Field>
              </>
            )}
            <Field label="Email">
              <input
                ref={isSignup ? undefined : firstInput}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="adresa@ta.com"
                autoComplete="email"
                inputMode="email"
                className="auth-input"
              />
            </Field>
            <Field label="Parolă" hint={isSignup ? "minim 8 caractere" : undefined}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={isSignup ? "new-password" : "current-password"}
                className="auth-input"
              />
            </Field>

            {error && (
              <div className="rounded-xl px-3 py-2.5 font-sans text-[13px]" style={{ background: "#FFEBEE", color: "#C62828" }}>
                {error}
              </div>
            )}

            <button
              onClick={submit}
              disabled={busy}
              className="w-full h-12 rounded-2xl font-sans text-[14px] font-semibold text-white mt-2 active:scale-[0.97] transition-transform disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #E91E8C, #C2185B)" }}
            >
              {busy ? "Se trimite…" : isSignup ? "Creează cont" : "Conectează-te"}
            </button>

            <button
              onClick={() => onSwitchMode(isSignup ? "signin" : "signup")}
              className="w-full mt-1 py-2 font-sans text-[13px] active:opacity-70"
              style={{ color: "#C2185B" }}
            >
              {isSignup ? "Am deja cont · Conectare" : "Nu am cont · Creează unul"}
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes auth-sheet-up {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        .auth-input {
          width: 100%;
          padding: 10px 12px;
          border-radius: 12px;
          background: #f5f5f7;
          border: 1px solid #e5e5ea;
          color: #1a1820;
          font-family: inherit;
          font-size: 14px;
          outline: none;
        }
        .auth-input:focus {
          border-color: #E91E8C;
          background: #fff;
        }
      `}</style>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "#8e8e93" }}>
        {label}{hint ? <span style={{ textTransform: "none", letterSpacing: 0, marginLeft: 6, color: "#bcbcc1" }}>· {hint}</span> : null}
      </span>
      {children}
    </label>
  );
}
