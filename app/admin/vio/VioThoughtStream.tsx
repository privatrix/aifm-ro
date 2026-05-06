"use client";

import { useState } from "react";
import type { VioThought } from "@/db/schema";

export default function VioThoughtStream({ initial }: { initial: VioThought[] }) {
  const [thoughts, setThoughts] = useState<VioThought[]>(initial);
  const [generating, setGenerating] = useState(false);

  async function generate() {
    setGenerating(true);
    try {
      const r = await fetch("/api/admin/vio-thoughts", { method: "POST" });
      const j = await r.json();
      if (!j.ok) {
        alert("Error: " + (j.error || "unknown"));
        return;
      }
      // Reload list
      const list = await fetch("/api/admin/vio-thoughts", { cache: "no-store" }).then(r => r.json());
      if (list.ok) setThoughts(list.thoughts);
    } finally {
      setGenerating(false);
    }
  }

  async function toggleApprove(t: VioThought) {
    const r = await fetch(`/api/admin/vio-thoughts/${t.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ approved: !t.approved }),
    });
    const j = await r.json();
    if (j.ok) setThoughts(prev => prev.map(p => p.id === t.id ? j.thought : p));
  }

  async function remove(t: VioThought) {
    if (!confirm("Delete this thought?")) return;
    const r = await fetch(`/api/admin/vio-thoughts/${t.id}`, { method: "DELETE" });
    const j = await r.json();
    if (j.ok) setThoughts(prev => prev.filter(p => p.id !== t.id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={generate}
          disabled={generating}
          className="admin-btn admin-btn-primary !text-xs"
        >
          {generating ? "Vio is thinking…" : "💭 Generate new thought"}
        </button>
        <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "rgba(236,231,216,0.45)" }}>
          {thoughts.length} thoughts
        </span>
      </div>

      {thoughts.length === 0 ? (
        <div className="admin-dropzone text-center">
          <p className="text-sm" style={{ color: "rgba(236,231,216,0.7)" }}>
            No thoughts yet. Generate one or wait for a track change to fire it.
          </p>
          <p className="text-[11px] mt-1" style={{ color: "rgba(236,231,216,0.45)" }}>
            Requires <code className="mono">ANTHROPIC_API_KEY</code> set in Vercel env.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {thoughts.map(t => {
            const ageSec = (Date.now() - new Date(t.generatedAt).getTime()) / 1000;
            const fresh = ageSec < 300;
            return (
              <div key={t.id} className="admin-card p-3 flex items-start gap-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-serif text-[12px] text-white shrink-0 ${fresh ? "animate-breathe" : ""}`}
                  style={{ background: "linear-gradient(135deg, #E91E8C, #C2185B)" }}
                >V</div>
                <div className="flex-1 min-w-0">
                  <p className="font-serif italic text-[14px] leading-snug" style={{ color: t.approved ? "#f5efe2" : "rgba(236,231,216,0.4)" }}>
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] mono uppercase tracking-widest" style={{ color: "rgba(236,231,216,0.45)" }}>
                    <span>{ageRelative(ageSec)}</span>
                    <span style={{ color: "rgba(236,231,216,0.25)" }}>·</span>
                    <span>{t.band || "anytime"}</span>
                    <span style={{ color: "rgba(236,231,216,0.25)" }}>·</span>
                    <span>{t.source}</span>
                    {fresh && (
                      <>
                        <span style={{ color: "rgba(236,231,216,0.25)" }}>·</span>
                        <span style={{ color: "#ffb1cc" }}>● live on air</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    onClick={() => toggleApprove(t)}
                    className="text-[10px] mono uppercase tracking-widest"
                    style={{ color: t.approved ? "#84d488" : "rgba(236,231,216,0.5)" }}
                  >
                    {t.approved ? "✓ approved" : "rejected"}
                  </button>
                  <button
                    onClick={() => remove(t)}
                    className="text-[10px] mono uppercase tracking-widest"
                    style={{ color: "#ff7370" }}
                  >
                    delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ageRelative(sec: number): string {
  if (sec < 60) return `${Math.floor(sec)}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}
