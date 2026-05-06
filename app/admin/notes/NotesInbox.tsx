"use client";

import { useMemo, useState } from "react";
import type { Note } from "@/db/schema";

type Filter = "all" | "pending" | "read" | "archived" | "public";

export default function NotesInbox({ initial }: { initial: Note[] }) {
  const [items, setItems] = useState<Note[]>(initial);
  const [filter, setFilter] = useState<Filter>("pending");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editReply, setEditReply] = useState("");
  const [editFromName, setEditFromName] = useState("");
  const [busy, setBusy] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "public") return items.filter(i => i.public);
    return items.filter(i => i.status === filter);
  }, [items, filter]);

  const counts = useMemo(() => ({
    all: items.length,
    pending: items.filter(i => i.status === "pending").length,
    read: items.filter(i => i.status === "read").length,
    archived: items.filter(i => i.status === "archived").length,
    public: items.filter(i => i.public).length,
  }), [items]);

  function startEdit(n: Note) {
    setEditingId(n.id);
    setEditReply(n.reply || "");
    setEditFromName(n.fromName || "anonim");
  }

  async function patch(id: number, body: Record<string, unknown>) {
    setBusy(id);
    try {
      const r = await fetch(`/api/admin/notes/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (j.ok) {
        setItems(prev => prev.map(it => it.id === id ? j.note : it));
      } else {
        alert("Error: " + (j.error || "unknown"));
      }
    } finally {
      setBusy(null);
    }
  }

  async function saveReply(id: number) {
    await patch(id, {
      reply: editReply.trim() || null,
      fromName: editFromName.trim() || "anonim",
      status: "read",
    });
    setEditingId(null);
  }

  async function togglePublic(n: Note) {
    await patch(n.id, { public: !n.public });
  }

  async function archive(n: Note) {
    await patch(n.id, { status: "archived" });
  }

  async function unarchive(n: Note) {
    await patch(n.id, { status: "pending" });
  }

  async function remove(id: number) {
    if (!confirm("Permanently delete this note?")) return;
    setBusy(id);
    try {
      const r = await fetch(`/api/admin/notes/${id}`, { method: "DELETE" });
      const j = await r.json();
      if (j.ok) setItems(prev => prev.filter(it => it.id !== id));
    } finally {
      setBusy(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="admin-dropzone text-center">
        <p className="text-sm" style={{ color: "rgba(236,231,216,0.7)" }}>No notes yet.</p>
        <p className="text-[11px] mt-1" style={{ color: "rgba(236,231,216,0.45)" }}>
          Listener submissions from the Bilete tab will land here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-xs">
        {(["pending", "read", "public", "archived", "all"] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="admin-btn !py-1.5 !px-3 !text-xs"
            style={{
              background: filter === f
                ? "linear-gradient(135deg, #E91E8C, #C2185B)"
                : "rgba(255,255,255,0.04)",
              color: filter === f ? "#fff" : "rgba(236,231,216,0.7)",
              border: filter === f ? "1px solid transparent" : "1px solid rgba(255,255,255,0.10)",
            }}
          >
            {f} <span className="opacity-60 ml-1">{counts[f]}</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(n => (
          <div key={n.id} className="admin-card p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-sans font-semibold text-[13px]" style={{ color: "#f5efe2" }}>
                    {n.fromName || "anonim"}
                  </span>
                  <span className="font-mono text-[10px]" style={{ color: "rgba(236,231,216,0.45)" }}>
                    {new Date(n.createdAt).toLocaleString("ro-RO")}
                  </span>
                  <Badge status={n.status} isPublic={n.public} />
                </div>
                <p className="font-serif text-[15px] italic mt-1.5 leading-snug" style={{ color: "rgba(236,231,216,0.85)" }}>
                  &ldquo;{n.text}&rdquo;
                </p>
              </div>
            </div>

            {n.reply && editingId !== n.id && (
              <div
                className="rounded-xl px-4 py-3 mt-3"
                style={{ background: "rgba(233,30,140,0.10)", border: "1px solid rgba(233,30,140,0.25)" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center font-serif text-[10px] text-white"
                    style={{ background: "linear-gradient(135deg, #E91E8C, #C2185B)" }}
                  >V</div>
                  <span className="text-[10px] mono uppercase tracking-widest" style={{ color: "#ffb1cc" }}>Vio replied</span>
                </div>
                <p className="font-serif text-[14px] italic" style={{ color: "#ffd4e3" }}>{n.reply}</p>
              </div>
            )}

            {editingId === n.id ? (
              <div className="mt-3 space-y-2">
                <div>
                  <label className="admin-label">From name (override)</label>
                  <input
                    value={editFromName}
                    onChange={e => setEditFromName(e.target.value)}
                    className="admin-input !py-1.5"
                    placeholder="anonim"
                  />
                </div>
                <div>
                  <label className="admin-label">Vio&apos;s reply (optional)</label>
                  <textarea
                    value={editReply}
                    onChange={e => setEditReply(e.target.value)}
                    className="admin-textarea"
                    rows={2}
                    placeholder="Leave empty to mark read with no reply"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={busy === n.id}
                    onClick={() => saveReply(n.id)}
                    className="admin-btn admin-btn-primary !py-1.5 !text-xs"
                  >
                    Save & mark read
                  </button>
                  <button
                    disabled={busy === n.id}
                    onClick={() => setEditingId(null)}
                    className="admin-btn admin-btn-ghost !py-1.5 !text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  disabled={busy === n.id}
                  onClick={() => startEdit(n)}
                  className="admin-btn admin-btn-ghost !py-1 !px-3 !text-xs"
                >
                  {n.reply ? "Edit reply" : "Reply"}
                </button>
                {n.status !== "read" && (
                  <button
                    disabled={busy === n.id}
                    onClick={() => patch(n.id, { status: "read" })}
                    className="admin-btn admin-btn-ghost !py-1 !px-3 !text-xs"
                  >
                    Mark read
                  </button>
                )}
                <button
                  disabled={busy === n.id}
                  onClick={() => togglePublic(n)}
                  className="admin-btn admin-btn-ghost !py-1 !px-3 !text-xs"
                  style={{
                    color: n.public ? "#84d488" : undefined,
                    borderColor: n.public ? "rgba(76,175,80,0.45)" : undefined,
                  }}
                >
                  {n.public ? "✓ Published" : "Publish"}
                </button>
                {n.status !== "archived" ? (
                  <button
                    disabled={busy === n.id}
                    onClick={() => archive(n)}
                    className="admin-btn admin-btn-ghost !py-1 !px-3 !text-xs"
                  >
                    Archive
                  </button>
                ) : (
                  <button
                    disabled={busy === n.id}
                    onClick={() => unarchive(n)}
                    className="admin-btn admin-btn-ghost !py-1 !px-3 !text-xs"
                  >
                    Restore
                  </button>
                )}
                <button
                  disabled={busy === n.id}
                  onClick={() => remove(n.id)}
                  className="admin-btn admin-btn-danger !py-1 !px-3 !text-xs ml-auto"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-10 font-mono text-[11px] uppercase tracking-widest" style={{ color: "rgba(236,231,216,0.4)" }}>
            no notes match this filter
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ status, isPublic }: { status: string; isPublic: boolean }) {
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    pending:  { bg: "rgba(255,167,38,0.15)", color: "#ffb86b", border: "rgba(255,167,38,0.30)" },
    read:     { bg: "rgba(76,175,80,0.15)", color: "#84d488", border: "rgba(76,175,80,0.30)" },
    archived: { bg: "rgba(158,158,158,0.10)", color: "#a0a0a0", border: "rgba(158,158,158,0.20)" },
  };
  const st = styles[status] ?? styles.pending;
  return (
    <span className="flex items-center gap-1">
      <span
        className="admin-pill"
        style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}
      >
        {status}
      </span>
      {isPublic && (
        <span
          className="admin-pill"
          style={{ background: "rgba(233,30,140,0.12)", color: "#ffb1cc", border: "1px solid rgba(233,30,140,0.30)" }}
        >
          public
        </span>
      )}
    </span>
  );
}
