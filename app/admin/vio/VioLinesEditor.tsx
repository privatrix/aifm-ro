"use client";

import { useState } from "react";
import type { VioLine } from "@/db/schema";

const BANDS = [
  { value: "", label: "Any time" },
  { value: "morning", label: "Morning (06–10)" },
  { value: "day", label: "Day (10–18)" },
  { value: "evening", label: "Evening (18–22)" },
  { value: "night", label: "Night (22–06)" },
];

export default function VioLinesEditor({ initial }: { initial: VioLine[] }) {
  const [lines, setLines] = useState<VioLine[]>(initial);
  const [draftText, setDraftText] = useState("");
  const [draftBand, setDraftBand] = useState<string>("");
  const [busy, setBusy] = useState<number | null>(null);

  async function add() {
    if (!draftText.trim()) return;
    const r = await fetch("/api/admin/vio-lines", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: draftText.trim(),
        band: draftBand || null,
        enabled: true,
      }),
    });
    const j = await r.json();
    if (j.ok) {
      setLines(prev => [j.line, ...prev]);
      setDraftText("");
      setDraftBand("");
    } else {
      alert("Error: " + (j.error || "unknown"));
    }
  }

  async function patch(id: number, body: Record<string, unknown>) {
    setBusy(id);
    try {
      const r = await fetch(`/api/admin/vio-lines/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (j.ok) setLines(prev => prev.map(l => l.id === id ? j.line : l));
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this line?")) return;
    setBusy(id);
    try {
      const r = await fetch(`/api/admin/vio-lines/${id}`, { method: "DELETE" });
      const j = await r.json();
      if (j.ok) setLines(prev => prev.filter(l => l.id !== id));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Add new */}
      <div className="admin-card p-4 space-y-3">
        <label className="admin-label">New line</label>
        <textarea
          value={draftText}
          onChange={e => setDraftText(e.target.value)}
          rows={2}
          maxLength={300}
          placeholder="Eu nu dorm. Tu de ce dormi?"
          className="admin-textarea"
        />
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={draftBand}
            onChange={e => setDraftBand(e.target.value)}
            className="admin-select !w-auto !py-1.5"
          >
            {BANDS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
          <span className="font-mono text-[10px]" style={{ color: "rgba(236,231,216,0.4)" }}>
            {draftText.length}/300
          </span>
          <button onClick={add} disabled={!draftText.trim()} className="admin-btn admin-btn-primary !py-1.5 !px-4 !text-xs ml-auto">
            Add line
          </button>
        </div>
      </div>

      {/* List */}
      <div className="admin-card overflow-hidden">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Line</th>
              <th>Band</th>
              <th>Enabled</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lines.map(l => (
              <tr key={l.id}>
                <td style={{ color: "#f5efe2" }}>
                  <span className="font-serif italic text-[14px]">&ldquo;{l.text}&rdquo;</span>
                </td>
                <td>
                  <select
                    value={l.band || ""}
                    onChange={e => patch(l.id, { band: e.target.value || null })}
                    disabled={busy === l.id}
                    className="admin-select !w-auto !py-1 !text-[11px]"
                  >
                    {BANDS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                  </select>
                </td>
                <td>
                  <button
                    onClick={() => patch(l.id, { enabled: !l.enabled })}
                    disabled={busy === l.id}
                    className="admin-pill"
                    style={{
                      background: l.enabled ? "rgba(76,175,80,0.15)" : "rgba(158,158,158,0.10)",
                      color: l.enabled ? "#84d488" : "#a0a0a0",
                      border: `1px solid ${l.enabled ? "rgba(76,175,80,0.30)" : "rgba(158,158,158,0.20)"}`,
                    }}
                  >
                    {l.enabled ? "✓ on" : "off"}
                  </button>
                </td>
                <td className="text-right">
                  <button
                    onClick={() => remove(l.id)}
                    disabled={busy === l.id}
                    style={{ color: "#ff7370" }}
                    className="text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
