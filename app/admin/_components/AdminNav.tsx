"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin/songs", label: "Songs" },
  { href: "/admin/notes", label: "Notes" },
  { href: "/admin/stats", label: "Stats" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminNav({ variant }: { variant: "sidebar" | "bottom" }) {
  const pathname = usePathname();
  if (variant === "bottom") {
    return (
      <ul className="grid grid-cols-4">
        {ITEMS.map((it) => {
          const active = pathname?.startsWith(it.href);
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={`block text-center text-[11px] uppercase tracking-wider py-3 ${active ? "text-zinc-100 bg-zinc-800" : "text-zinc-400"}`}
              >
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }
  return (
    <ul className="flex-1 py-2">
      {ITEMS.map((it) => {
        const active = pathname?.startsWith(it.href);
        return (
          <li key={it.href}>
            <Link
              href={it.href}
              className={`block px-5 py-2 text-sm border-l-2 ${active ? "border-zinc-100 bg-zinc-800/60 text-zinc-100" : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"}`}
            >
              {it.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
