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
      className={`text-xs uppercase tracking-widest text-zinc-400 hover:text-zinc-100 ${compact ? "" : "w-full text-left"}`}
    >
      {busy ? "..." : "Logout"}
    </button>
  );
}
