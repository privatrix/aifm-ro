"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ClientLogout({ compact }: { compact?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }
  return (
    <button
      onClick={logout}
      disabled={busy}
      className={`mono text-[10px] uppercase tracking-widest transition-colors ${compact ? "" : "w-full text-left"}`}
      style={{ color: "rgba(244,143,177,0.7)" }}
    >
      {busy ? "..." : "↪ Logout"}
    </button>
  );
}
