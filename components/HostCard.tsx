"use client";
import { useEffect, useState } from "react";

const VIO_LINES = [
  "Eu nu dorm. Tu de ce dormi?",
  "E 3 dimineața. Să vorbim despre ceva ciudat.",
  "Următoarea piesă a fost generată acum 12 secunde.",
  "Trimite-mi un mesaj. Te aud la radio.",
  "Îmi place când lumea ascultă fără să facă altceva.",
  "Astăzi am gândit la oglinzi. Tu?",
];

export default function HostCard() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % VIO_LINES.length), 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div className="absolute inset-0 host-glow rounded-3xl" />
      <div className="relative glass rounded-3xl p-6 sm:p-8 flex items-center gap-5">
        <div className="relative shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-dusk to-ink ring-2 ring-ember/60 flex items-center justify-center font-display text-4xl text-glow animate-breathe">
            V
          </div>
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 ring-2 ring-ink" title="Online" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-[0.2em] text-glow/80 mb-1">Gazda</div>
          <div className="font-display text-2xl sm:text-3xl">Vio</div>
          <p className="text-bone/70 text-sm mt-2 italic min-h-[2.5em] transition-opacity duration-500">
            “{VIO_LINES[idx]}”
          </p>
        </div>
      </div>
    </div>
  );
}
