"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminNav from "./AdminNav";
import ClientLogout from "./ClientLogout";

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Login screen renders without admin chrome.
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <aside className="hidden md:flex md:w-56 md:flex-col border-r border-zinc-800 bg-zinc-900">
        <div className="px-5 py-5 border-b border-zinc-800">
          <Link href="/admin" className="text-sm font-semibold tracking-wide text-zinc-100">
            AI FM Admin
          </Link>
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">control room</div>
        </div>
        <AdminNav variant="sidebar" />
        <div className="mt-auto p-4 border-t border-zinc-800">
          <ClientLogout />
        </div>
      </aside>

      <header className="md:hidden flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-3">
        <Link href="/admin" className="text-sm font-semibold">
          AI FM Admin
        </Link>
        <ClientLogout compact />
      </header>

      <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">{children}</main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-zinc-800 bg-zinc-900">
        <AdminNav variant="bottom" />
      </nav>
    </div>
  );
}
