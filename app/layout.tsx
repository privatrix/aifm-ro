import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";

const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", variable: "--font-serif", display: "swap" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "AI FM · The Booth",
  description: "24 de ore în cabina de radio. Vio nu doarme.",
  metadataBase: new URL("https://aifm.ro"),
  openGraph: {
    title: "AI FM",
    description: "Vio nu doarme.",
    type: "website",
    locale: "ro_RO",
  },
};

export const viewport: Viewport = {
  themeColor: "#070708",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={`${mono.variable} ${serif.variable} ${sans.variable}`}>
      <body className="bg-ink text-bone overflow-hidden">{children}</body>
    </html>
  );
}
