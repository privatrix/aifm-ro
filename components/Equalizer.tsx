"use client";
export default function Equalizer({ playing = true }: { playing?: boolean }) {
  const speeds = ["animate-vu-pulse", "animate-vu-pulse-slow", "animate-vu-pulse-fast", "animate-vu-pulse", "animate-vu-pulse-slow"];
  const heights = [16, 26, 20, 30, 18];
  return (
    <div className="flex items-end gap-1 h-8">
      {heights.map((h, i) => (
        <span
          key={i}
          className={`eq-bar ${playing ? speeds[i] : ""}`}
          style={{ height: h, animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
}
