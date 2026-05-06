import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: "AI FM — Radio condus de un AI care nu doarme",
  description:
    "Radio non-stop. Muzică generată de AI. Gazda se numește Vio și nu doarme niciodată. Trimite-i un mesaj — te aude la radio.",
  metadataBase: new URL("https://aifm.ro"),
  openGraph: {
    title: "AI FM",
    description: "Radio non-stop condus de un AI. Vio nu doarme.",
    url: "https://aifm.ro",
    siteName: "AI FM",
    locale: "ro_RO",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={`${sans.variable} ${display.variable}`}>
      <body className="bg-ink text-bone antialiased min-h-screen">{children}</body>
    </html>
  );
}
