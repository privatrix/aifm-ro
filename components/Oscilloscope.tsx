"use client";
import { useEffect, useRef } from "react";

export default function Oscilloscope({ playing }: { playing: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const raf = useRef<number | null>(null);
  const t   = useRef(0);

  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const r = c.getBoundingClientRect();
      c.width  = r.width  * dpr;
      c.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const r = c.getBoundingClientRect();
      const w = r.width, h = r.height;
      ctx.clearRect(0, 0, w, h);

      t.current += playing ? 0.018 : 0.004;

      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      const cx  = w / 2;
      const amp = playing ? Math.min(h * 0.38, 100) : h * 0.06;

      const wave = (color: string, phase: number, alpha: number, lw: number) => {
        ctx.strokeStyle = color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth   = lw;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const dx   = (x - cx) / w;
          const fall = Math.exp(-Math.pow(dx * 3.2, 2));
          const y    =
            h / 2 +
            fall * (
              Math.sin(x * 0.046 + t.current * 4   + phase) * amp * 0.50 +
              Math.sin(x * 0.019 + t.current * 1.3 + phase) * amp * 0.33 +
              Math.sin(x * 0.091 + t.current * 7   + phase) * amp * 0.17 +
              (Math.random() - 0.5) * (playing ? 3.5 : 0.8)
            );
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      };

      wave("#FF4081", 0,   0.9,  1.8);
      wave("#E91E8C", 0.6, 0.45, 1.1);
      wave("#ffffff", 1.4, 0.18, 0.9);

      raf.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [playing]);

  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}
