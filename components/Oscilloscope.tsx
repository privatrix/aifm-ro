"use client";
import { useEffect, useRef } from "react";

const NUM_BARS = 30;

export default function Oscilloscope({ playing }: { playing: boolean }) {
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef  = useRef<number | null>(null);
  const tRef    = useRef(0);

  useEffect(() => {
    const animate = () => {
      tRef.current += playing ? 0.07 : 0.012;
      barsRef.current.forEach((bar, i) => {
        if (!bar) return;
        const v =
          Math.abs(Math.sin(i * 0.38 + tRef.current * 2.1)) * 0.45 +
          Math.abs(Math.sin(i * 0.74 + tRef.current * 1.3)) * 0.30 +
          Math.abs(Math.sin(i * 0.19 + tRef.current * 0.7)) * 0.25;
        const h = playing ? Math.max(12, v * 100) : Math.max(5, v * 18);
        bar.style.height = `${h}%`;
      });
      rafRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [playing]);

  return (
    <div className="absolute inset-0 flex items-center gap-[3px] px-1">
      {Array.from({ length: NUM_BARS }).map((_, i) => (
        <div
          key={i}
          ref={el => { barsRef.current[i] = el; }}
          className="eq-bar"
          style={{ height: "20%" }}
        />
      ))}
    </div>
  );
}
