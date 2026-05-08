"use client";
/**
 * Bottom sheet for changing the password while signed in. Same visual
 * language as AuthSheet (pink hero + white form). Uses /api/me/password.
 *
 * Three fields: current password, new password, confirm new password.
 * Server enforces "new must differ from current" + min length; we mirror
 * the confirm-match check on the client for instant feedback.
 */
import { useEffect, useRef, useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ChangePasswordSheet({ open, onClose, onSuccess }: Props) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const firstInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setCurrent(""); setNext(""); setConfirm("");
      setError(""); setDone(false); setBusy(false);
      const t = setTimeout(() => firstInput.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!open) return null;

  async function submit() {
    setError("");
    if (next !== confirm) {
      setError("Parolele noi nu se potrivesc.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/me/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
        cache: "no-store",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) {
        setError(j?.error ?? "Ceva nu a mers.");
        setBusy(false);
        return;
      }
      setDone(true);
      setBusy(false);
      // Auto-close after a short success animation.
      setTimeout(() => { onSuccess?.(); onClose(); }, 1400);
    } catch {
      setError("Conexiune eșuată.");
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}
    >
      <div
        className="w-full bg-white rounded-t-3xl flex flex-col"
        style={{ maxHeight: "92dvh", animation: "auth-sheet-up 280ms cubic-bezier(.2,.8,.2,1)" }}
      >
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
          <h2 className="text-white font-sans font-bold text-[22px]">Schimbă parola</h2>
          <p className="text-white/80 font-sans text-[13px] mt-1.5 max-w-[300px]">
            După salvare te scoatem de pe celelalte dispozitive.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pt-5 pb-7">
          {done ? (
            <div className="text-center py-8 animate-fade-in">
              <div
                className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center text-white"
                style={{ background: "linear-gradient(135deg, #E91E8C, #C2185B)" }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>
              <div className="font-sans font-bold text-[18px] mb-1" style={{ color: "#1a1820" }}>Parola schimbată.</div>
              <div className="font-sans text-[13px]" style={{ color: "#8e8e93" }}>Folosește noua parolă data viitoare.</div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Field label="Parola curentă">
                <input
                  ref={firstInput}
                  type="password"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  autoComplete="current-password"
                  className="auth-input"
                  placeholder="••••••••"
                />
              </Field>
              <Field label="Parolă nouă" hint="minim 8 caractere">
                <input
                  type="password"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  autoComplete="new-password"
                  className="auth-input"
                  placeholder="••••••••"
                />
              </Field>
              <Field label="Confirmă parola nouă">
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  className="auth-input"
                  placeholder="••••••••"
                />
              </Field>

              {error && (
                <div className="rounded-xl px-3 py-2.5 font-sans text-[13px]" style={{ background: "#FFEBEE", color: "#C62828" }}>
                  {error}
                </div>
              )}

              <button
                onClick={submit}
                disabled={busy || !current || !next || !confirm}
                className="w-full h-12 rounded-2xl font-sans text-[14px] font-semibold text-white mt-2 active:scale-[0.97] transition-transform disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #E91E8C, #C2185B)" }}
              >
                {busy ? "Se salvează…" : "Salvează parola"}
              </button>
            </div>
          )}
        </div>
      </div>
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
