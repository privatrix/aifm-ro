import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0a0a0f",
        ember: "#ff6b35",
        glow: "#ffb347",
        bone: "#f5f1e8",
        dusk: "#1a1625",
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-serif", "Georgia"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      animation: {
        "vu-pulse": "vu 1.2s ease-in-out infinite",
        "vu-pulse-slow": "vu 1.8s ease-in-out infinite",
        "vu-pulse-fast": "vu 0.8s ease-in-out infinite",
        breathe: "breathe 4s ease-in-out infinite",
        ticker: "ticker 40s linear infinite",
      },
      keyframes: {
        vu: {
          "0%,100%": { transform: "scaleY(0.3)" },
          "50%": { transform: "scaleY(1)" },
        },
        breathe: {
          "0%,100%": { opacity: "0.85", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.02)" },
        },
        ticker: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
