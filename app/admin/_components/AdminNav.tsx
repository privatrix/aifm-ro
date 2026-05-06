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
                aria-current={active ? "page" : undefined}
                className="block text-center text-[10px] uppercase tracking-widest py-3"
                style={{
                  color: active ? "#ffb1cc" : "rgba(236,231,216,0.55)",
                  background: active ? "rgba(233,30,140,0.10)" : "transparent",
                }}
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
    <ul className="flex-1 py-3 px-2 space-y-1">
      {ITEMS.map((it) => {
        const active = pathname?.startsWith(it.href);
        return (
          <li key={it.href}>
            <Link
              href={it.href}
              aria-current={active ? "page" : undefined}
              className="admin-nav-item"
            >
              {it.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
