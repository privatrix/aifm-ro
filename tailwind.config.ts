import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Page background (deep purple like screenshot)
        void:    "#3B1A60",
        surface: "#2D1450",
        // Pink/crimson palette
        aifm:    "#E91E8C",
        crimson: "#C2185B",
        magenta: "#9C1458",
        // Row colors (stations)
        rowpink: "#C2185B",
        rowred:  "#E53935",
        roworange: "#F57C00",
        rowpurple: "#7B1FA2",
        // Text
        ink:     "#1A1A2E",
        graytext:"#888888",
        // Keep these for backward compat
        bone:    "#FFFFFF",
        muted:   "#9D8DB0",
        cyan:    "#5fd4e6",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "ui-serif", "Georgia"],
        mono:  ["var(--font-mono)", "ui-monospace", "Menlo"],
        sans:  ["var(--font-sans)", "ui-sans-serif", "system-ui"],
      },
      animation: {
        breathe:    "breathe 2s ease-in-out infinite",
        blink:      "blink 1.4s steps(1) infinite",
        "slide-up": "slide-up 0.32s cubic-bezier(0.16,1,0.3,1)",
        "fade-in":  "fade-in 0.2s ease-out",
      },
      keyframes: {
        breathe: {
          "0%,100%": { opacity: "0.6" },
          "50%":     { opacity: "1" },
        },
        blink: {
          "0%,50%":   { opacity: "1" },
          "51%,100%": { opacity: "0" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to:   { transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
