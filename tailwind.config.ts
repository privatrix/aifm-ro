import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#070708",
        booth: "#0e0d10",
        tungsten: "#f5b562",
        amber: "#c47626",
        cyan: "#5fd4e6",
        bone: "#ece7d8",
        ash: "#7a7679",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "ui-serif", "Georgia"],
        mono: ["var(--font-mono)", "ui-monospace", "Menlo"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
      },
      animation: {
        flicker: "flicker 6s infinite",
        breathe: "breathe 5s ease-in-out infinite",
        marquee: "marquee 28s linear infinite",
        blink: "blink 1.4s steps(1) infinite",
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
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        blink: {
          "0%,50%": { opacity: "1" },
          "51%,100%": { opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
