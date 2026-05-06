import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void:     "#0d0620",
        surface:  "#1a0e2e",
        panel:    "#22103a",
        tungsten: "#E91E8C",
        crimson:  "#C2185B",
        magenta:  "#9C1458",
        fushia:   "#D81B60",
        rose:     "#FF4081",
        tangerine:"#F57C00",
        coral:    "#E64A19",
        ruby:     "#D32F2F",
        cyan:     "#5fd4e6",
        gold:     "#FFD740",
        bone:     "#FFFFFF",
        offwhite: "#F0E8FF",
        muted:    "#9D8DB0",
        dim:      "#6B5F80",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "ui-serif", "Georgia"],
        mono:  ["var(--font-mono)", "ui-monospace", "Menlo"],
        sans:  ["var(--font-sans)", "ui-sans-serif", "system-ui"],
      },
      animation: {
        flicker:    "flicker 6s infinite",
        breathe:    "breathe 5s ease-in-out infinite",
        marquee:    "marquee 28s linear infinite",
        blink:      "blink 1.4s steps(1) infinite",
        "slide-up": "slide-up 0.35s cubic-bezier(0.16,1,0.3,1)",
        "fade-in":  "fade-in 0.25s ease-out",
        "scale-in": "scale-in 0.25s cubic-bezier(0.16,1,0.3,1)",
      },
      keyframes: {
        flicker: {
          "0%,19%,21%,23%,25%,54%,56%,100%": { opacity: "1" },
          "20%,24%,55%": { opacity: "0.78" },
        },
        breathe: {
          "0%,100%": { opacity: "0.85" },
          "50%": { opacity: "1" },
        },
        marquee: {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        blink: {
          "0%,50%":   { opacity: "1" },
          "51%,100%": { opacity: "0" },
        },
        "slide-up": {
          from: { transform: "translateY(24px)", opacity: "0" },
          to:   { transform: "translateY(0)",    opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "scale-in": {
          from: { transform: "scale(0.93)", opacity: "0" },
          to:   { transform: "scale(1)",    opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
