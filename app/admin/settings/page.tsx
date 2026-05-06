"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [health, setHealth] = useState<string>("");
  const [migrating, setMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState<string>("");

  async function check() {
    setHealth("…");
    const r = await fetch("/api/admin/health");
    const j = await r.json();
    setHealth(JSON.stringify(j, null, 2));
  }

  async function migrateGenres() {
    if (!confirm("Map all non-Romanian genre tags to the canonical list?")) return;
    setMigrating(true);
    try {
      const r = await fetch("/api/admin/migrate-genres", { method: "POST" });
      const j = await r.json();
      setMigrateResult(JSON.stringify(j, null, 2));
    } finally {
      setMigrating(false);
    }
  }

  return (
    <div className="space-y-8 max-w-xl">
      <h1 className="text-2xl font-serif">Settings</h1>

      <section className="space-y-3">
        <h2 className="admin-label !text-[12px]">Database</h2>
        <button onClick={check} className="admin-btn admin-btn-ghost">
          Check DB health
        </button>
        {health && (
          <pre className="admin-card p-3 text-xs mono overflow-auto" style={{ color: "rgba(236,231,216,0.85)" }}>
            {health}
          </pre>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="admin-label !text-[12px]">Broadcast</h2>
        <p className="text-[12px]" style={{ color: "rgba(236,231,216,0.55)" }}>
          Force the live radio to advance to the next song right now.
        </p>
        <button
          onClick={async () => {
            if (!confirm("Skip the current song now?")) return;
            const r = await fetch("/api/admin/skip-current", { method: "POST" });
            const j = await r.json();
            alert(j.ok ? `Now playing: ${j.current?.title}` : `Error: ${j.error}`);
          }}
          className="admin-btn admin-btn-ghost"
        >
          ⏭ Skip current track
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="admin-label !text-[12px]">Genre migration</h2>
        <p className="text-[12px]" style={{ color: "rgba(236,231,216,0.55)" }}>
          Re-map any old English genre tags (Ambient, Lo-fi, Synthwave, etc.) to the Romanian canonical list. Idempotent.
        </p>
        <button onClick={migrateGenres} disabled={migrating} className="admin-btn admin-btn-ghost">
          {migrating ? "Migrating…" : "Run genre migration"}
        </button>
        {migrateResult && (
          <pre className="admin-card p-3 text-xs mono overflow-auto" style={{ color: "rgba(236,231,216,0.85)" }}>
            {migrateResult}
          </pre>
        )}
      </section>
    </div>
  );
}
