"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [health, setHealth] = useState<string>("");
  async function check() {
    setHealth("…");
    const r = await fetch("/api/admin/health");
    const j = await r.json();
    setHealth(JSON.stringify(j, null, 2));
  }
  return (
    <div>
      <h1 className="text-xl text-zinc-100">Settings</h1>
      <div className="mt-6 space-y-3">
        <button onClick={check} className="bg-zinc-100 text-zinc-900 px-3 py-1.5 rounded text-sm">
          Check DB health
        </button>
        {health && (
          <pre className="bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-zinc-200 overflow-auto">
            {health}
          </pre>
        )}
      </div>
    </div>
  );
}
