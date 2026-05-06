"use client";

type Tab = "radio" | "biblioteca" | "top" | "bilete";

interface NavProps {
  active: Tab;
  setActive: (t: Tab) => void;
}

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "radio",
    label: "Radio",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M6.3 6.3a9 9 0 000 11.4M17.7 6.3a9 9 0 010 11.4"/>
        <path d="M3.4 3.4a14 14 0 000 17.2M20.6 3.4a14 14 0 010 17.2"/>
      </svg>
    ),
  },
  {
    id: "biblioteca",
    label: "Bibliotecă",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    id: "top",
    label: "Top 100",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M18 20V10M12 20V4M6 20v-6"/>
      </svg>
    ),
  },
  {
    id: "bilete",
    label: "Bilete",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
    ),
  },
];

export default function Nav({ active, setActive }: NavProps) {
  return (
    <nav className="shrink-0 pb-safe" style={{ background: "rgba(13,6,32,0.92)", backdropFilter: "blur(16px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center justify-around px-2 pt-1 pb-1">
        {TABS.map(tab => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className="flex flex-col items-center gap-0.5 px-4 py-2.5 rounded-2xl transition-all duration-150 active:scale-95"
              style={{
                color: isActive ? "#FF4081" : "rgba(255,255,255,0.4)",
                background: isActive ? "rgba(233,30,140,0.1)" : "transparent",
              }}
            >
              {tab.icon}
              <span
                className="font-mono text-[9px] tracking-wider uppercase"
                style={{ color: isActive ? "#FF4081" : "rgba(255,255,255,0.35)" }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
