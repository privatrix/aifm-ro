"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminNav from "./AdminNav";
import ClientLogout from "./ClientLogout";

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <aside className="admin-aside hidden md:flex md:w-56 md:flex-col">
        <div className="px-5 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-serif text-[16px] text-white"
              style={{ background: "linear-gradient(135deg, #E91E8C, #C2185B)" }}
            >
              V
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-wide text-white">AI FM</div>
              <div className="text-[10px] uppercase tracking-widest text-white/50">control room</div>
            </div>
          </Link>
        </div>
        <AdminNav variant="sidebar" />
        <div className="mt-auto p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <ClientLogout />
        </div>
      </aside>

      <header className="admin-topbar md:hidden flex items-center justify-between px-4 py-3">
        <Link href="/admin" className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center font-serif text-[14px] text-white"
            style={{ background: "linear-gradient(135deg, #E91E8C, #C2185B)" }}
          >
            V
          </div>
          <span className="text-sm font-semibold text-white">AI FM Admin</span>
        </Link>
        <ClientLogout compact />
      </header>

      <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">{children}</main>

      <nav className="admin-bottomnav md:hidden fixed bottom-0 inset-x-0 z-40">
        <AdminNav variant="bottom" />
      </nav>
    </div>
  );
}
