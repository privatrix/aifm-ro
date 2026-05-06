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
    <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5 admin-card p-8">
      <div className="text-center">
        <div
          className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center font-serif text-[26px] text-white"
          style={{ background: "linear-gradient(135deg, #E91E8C, #C2185B)" }}
        >
          V
        </div>
        <div className="mono text-[10px] uppercase tracking-widest mt-3" style={{ color: "rgba(236,231,216,0.5)" }}>
          AI FM · Control Room
        </div>
        <h1 className="font-serif text-2xl mt-1" style={{ color: "#f5efe2" }}>Admin login</h1>
      </div>
      <div>
        <label className="admin-label">Password</label>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="admin-input"
        />
      </div>
      {err && <div className="text-sm" style={{ color: "#ff7370" }}>{err}</div>}
      <button type="submit" disabled={loading} className="admin-btn admin-btn-primary w-full">
        {loading ? "..." : "Sign in"}
      </button>
    </form>
  );
}

export default function AdminLogin() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
