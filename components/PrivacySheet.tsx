"use client";
/**
 * Privacy bottom sheet.
 *
 * Three actions:
 *   1. Descarcă datele       — GET /api/me/export, downloads a JSON file
 *   2. Deconectează celelalte dispozitive — DELETE /api/me/sessions
 *   3. Șterge contul         — opens an in-sheet confirmation that asks for
 *                              the password, then DELETE /api/me with the
 *                              password as proof.
 *
 * The same visual language as AuthSheet / ChangePasswordSheet (pink hero,
 * white form, slide-up animation). The delete confirmation is rendered
 * inside the same sheet (a separate state) rather than as a nested modal,
 * so iOS doesn't get confused with two stacked overlays.
 */
import { useEffect, useRef, useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called after the user successfully deletes their account. */
  onAccountDeleted?: () => void;
}

type Mode = "menu" | "confirmDelete" | "deleted";

export default function PrivacySheet({ open, onClose, onAccountDeleted }: Props) {
  const [mode, setMode] = useState<Mode>("menu");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [password, setPassword] = useState("");
  const passwordInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setMode("menu");
      setBusy(false);
      setError("");
      setInfo("");
      setPassword("");
    }
  }, [open]);

  useEffect(() => {
    if (mode === "confirmDelete") {
      const t = setTimeout(() => passwordInput.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [mode]);

  if (!open) return null;

  // ── Action: download personal data export ─────────────────────────
  async function downloadExport() {
    setBusy(true); setError(""); setInfo("");
    try {
      const res = await fetch("/api/me/export", { cache: "no-store" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j?.error ?? "Nu am putut descărca datele.");
        setBusy(false);
        return;
      }
      const blob = await res.blob();
      // Pull the filename out of Content-Disposition if the server provided
      // one; otherwise fall back to a sensible default.
      const cd = res.headers.get("content-disposition") ?? "";
      const m = /filename="([^"]+)"/.exec(cd);
      const filename = m?.[1] ?? "aifm-export.json";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setInfo("Datele au fost descărcate.");
    } catch {
      setError("Conexiune eșuată.");
    } finally {
      setBusy(false);
    }
  }

  // ── Action: revoke all OTHER sessions ─────────────────────────────
  async function revokeOtherSessions() {
    setBusy(true); setError(""); setInfo("");
    try {
      const res = await fetch("/api/me/sessions", { method: "DELETE", cache: "no-store" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) {
        setError(j?.error ?? "Ceva nu a mers.");
      } else {
        const n = j.revoked ?? 0;
        setInfo(n === 0 ? "Nu existau alte sesiuni." : `Am deconectat ${n} dispozitiv${n === 1 ? "" : "e"}.`);
      }
    } catch {
      setError("Conexiune eșuată.");
    } finally {
      setBusy(false);
    }
  }

  // ── Action: delete account (after password confirmation) ──────────
  async function confirmDeleteAccount() {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/me", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
        cache: "no-store",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) {
        setError(j?.error ?? "Nu am putut șterge contul.");
        setBusy(false);
        return;
      }
      setMode("deleted");
      setBusy(false);
      // Give the user a moment to read the confirmation, then close + notify parent.
      setTimeout(() => { onAccountDeleted?.(); onClose(); }, 1800);
    } catch {
      setError("Conexiune eșuată.");
      setBusy(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────
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
              disabled={busy}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/85 active:scale-90 transition-transform"
              style={{ background: "rgba(255,255,255,0.14)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <h2 className="text-white font-sans font-bold text-[22px]">
            {mode === "menu" && "Confidențialitate"}
            {mode === "confirmDelete" && "Confirmă ștergerea"}
            {mode === "deleted" && "Cont șters"}
          </h2>
          <p className="text-white/80 font-sans text-[13px] mt-1.5 max-w-[300px]">
            {mode === "menu" && "Datele tale, la îndemână."}
            {mode === "confirmDelete" && "Acțiunea e definitivă. Introdu parola."}
            {mode === "deleted" && "Datele tale au fost șterse."}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pt-5 pb-7">
          {mode === "menu" && (
            <div className="flex flex-col gap-2">
              <Row
                title="Descarcă datele mele"
                hint="profil, favorite, bilete, istoric (JSON)"
                onClick={downloadExport}
                disabled={busy}
              />
              <Row
                title="Deconectează celelalte dispozitive"
                hint="păstrăm doar acest dispozitiv conectat"
                onClick={revokeOtherSessions}
                disabled={busy}
              />
              <RowDanger
                title="Șterge contul"
                hint="acțiunea nu poate fi anulată"
                onClick={() => { setError(""); setInfo(""); setMode("confirmDelete"); }}
                disabled={busy}
              />

              {info && (
                <div className="rounded-xl px-3 py-2.5 mt-2 font-sans text-[13px]" style={{ background: "#E8F5E9", color: "#1A7F37" }}>
                  {info}
                </div>
              )}
              {error && (
                <div className="rounded-xl px-3 py-2.5 mt-2 font-sans text-[13px]" style={{ background: "#FFEBEE", color: "#C62828" }}>
                  {error}
                </div>
              )}

              <div className="mt-5 px-1 font-sans text-[11px] leading-relaxed" style={{ color: "#8e8e93" }}>
                Datele tale rămân la noi doar atât timp cât ai contul activ. Când îl ștergi: profil, setări, favorite, ascultări — dispar. Biletele și voturile rămân, dar fără numele tău.
              </div>
            </div>
          )}

          {mode === "confirmDelete" && (
            <div className="flex flex-col gap-3">
              <div className="rounded-xl px-4 py-3" style={{ background: "#FFF3E0", color: "#7A4F01" }}>
                <div className="font-sans font-semibold text-[13px] mb-1">Ce dispare</div>
                <ul className="font-sans text-[12px] list-disc pl-5 space-y-0.5">
                  <li>Profilul, numele, handle-ul, avatarul</li>
                  <li>Setările contului</li>
                  <li>Toate piesele favorite și istoricul</li>
                  <li>Toate sesiunile active</li>
                </ul>
                <div className="font-sans text-[12px] mt-2">
                  Biletele și voturile rămân pentru istoricul radioului, dar fără să poată fi legate de tine.
                </div>
              </div>

              <label className="flex flex-col gap-1.5 mt-1">
                <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "#8e8e93" }}>
                  Parola contului
                </span>
                <input
                  ref={passwordInput}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="auth-input"
                  placeholder="••••••••"
                />
              </label>

              {error && (
                <div className="rounded-xl px-3 py-2.5 font-sans text-[13px]" style={{ background: "#FFEBEE", color: "#C62828" }}>
                  {error}
                </div>
              )}

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setMode("menu")}
                  disabled={busy}
                  className="flex-1 h-12 rounded-2xl font-sans text-[13px] font-medium active:scale-[0.97] transition-transform"
                  style={{ background: "#f5f5f7", color: "#1a1820" }}
                >
                  Renunță
                </button>
                <button
                  onClick={confirmDeleteAccount}
                  disabled={busy || !password}
                  className="flex-1 h-12 rounded-2xl font-sans text-[14px] font-semibold text-white active:scale-[0.97] transition-transform disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #C62828, #8B1A1A)" }}
                >
                  {busy ? "Se șterge…" : "Șterge contul"}
                </button>
              </div>
            </div>
          )}

          {mode === "deleted" && (
            <div className="text-center py-8 animate-fade-in">
              <div
                className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center text-white"
                style={{ background: "#1a1820" }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                </svg>
              </div>
              <div className="font-sans font-bold text-[18px] mb-1" style={{ color: "#1a1820" }}>Datele au plecat.</div>
              <div className="font-sans text-[13px]" style={{ color: "#8e8e93" }}>Mulțumim că ai ascultat.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ title, hint, onClick, disabled }: { title: string; hint?: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left active:bg-pink-50 transition-colors disabled:opacity-60"
      style={{ background: "#fafafa", border: "1px solid #ececef" }}
    >
      <div className="flex-1 min-w-0">
        <div className="font-sans font-semibold text-[14px]" style={{ color: "#1a1820" }}>{title}</div>
        {hint && <div className="font-sans text-[11px]" style={{ color: "#8e8e93" }}>{hint}</div>}
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#c7c7cc" }}>
        <path d="M9 6l6 6-6 6" />
      </svg>
    </button>
  );
}

function RowDanger({ title, hint, onClick, disabled }: { title: string; hint?: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left active:bg-red-50 transition-colors disabled:opacity-60 mt-2"
      style={{ background: "#FFF5F5", border: "1px solid #FFD7D7" }}
    >
      <div className="flex-1 min-w-0">
        <div className="font-sans font-semibold text-[14px]" style={{ color: "#C62828" }}>{title}</div>
        {hint && <div className="font-sans text-[11px]" style={{ color: "#9A4A4A" }}>{hint}</div>}
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#C62828" }}>
        <path d="M9 6l6 6-6 6" />
      </svg>
    </button>
  );
}
