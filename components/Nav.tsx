"use client";

type Tab = "radio" | "biblioteca" | "top" | "bilete";

interface NavProps {
  active: Tab;
  setActive: (t: Tab) => void;
}

const TABS: { id: Tab; label: string; icon: (active: boolean) => React.ReactNode }[] = [
  {
    id: "radio",
    label: "Radio",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8} strokeLinecap="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M6.3 6.3a9 9 0 000 11.4M17.7 6.3a9 9 0 010 11.4"/>
        <path d="M3.4 3.4a14 14 0 000 17.2M20.6 3.4a14 14 0 010 17.2"/>
      </svg>
    ),
  },
  {
    id: "biblioteca",
    label: "Bibliotecă",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8} strokeLinecap="round">
        <path d="M3 6h18M3 12h18M3 18h18"/>
        <circle cx="7" cy="6" r="1" fill="currentColor"/>
        <circle cx="7" cy="12" r="1" fill="currentColor"/>
        <circle cx="7" cy="18" r="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    id: "top",
    label: "Top 100",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8} strokeLinecap="round">
        <path d="M18 20V10M12 20V4M6 20v-6"/>
      </svg>
    ),
  },
  {
    id: "bilete",
    label: "Bilete",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
    ),
  },
];

export default function Nav({ active, setActive }: NavProps) {
  return (
    <nav className="bottom-nav shrink-0 flex">
      {TABS.map(tab => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className="flex-1 flex flex-col items-center gap-1 pt-2 transition-colors duration-150 active:brightness-95"
            style={{
              paddingBottom: "max(10px, env(safe-area-inset-bottom))",
              background: isActive ? "#FCE4EC" : "transparent",
              color: isActive ? "#E91E8C" : "#bbb",
              border: "none",
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {tab.icon(isActive)}
            <span
              className="font-sans font-medium"
              style={{ fontSize: "9px", letterSpacing: "0.04em", color: isActive ? "#E91E8C" : "#bbb" }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
