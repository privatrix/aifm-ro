"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin";
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const j = await r.json();
      if (!j.ok) {
        setErr(j.error || "Login failed");
        setLoading(false);
        return;
      }
      router.replace(next);
    } catch {
      setErr("Network error");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 border border-zinc-800 bg-zinc-900 p-8 rounded-md">
      <div>
        <div className="text-xs uppercase tracking-widest text-zinc-500">AI FM</div>
        <h1 className="text-xl mt-1">Admin login</h1>
      </div>
      <div>
        <label className="block text-xs text-zinc-400 mb-1">Password</label>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-700 px-3 py-2 rounded text-sm focus:outline-none focus:border-zinc-400"
        />
      </div>
      {err && <div className="text-sm text-red-400">{err}</div>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-zinc-100 text-zinc-900 py-2 rounded text-sm font-medium hover:bg-white disabled:opacity-50"
      >
        {loading ? "..." : "Sign in"}
      </button>
    </form>
  );
}

export default function AdminLogin() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 font-mono p-6">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
