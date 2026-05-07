import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";

const mono  = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", variable: "--font-serif", display: "swap" });
const sans  = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "AIFM – Radio AI Românesc",
  description: "Muzică generată de AI, prezentată de Vio, 24 de ore din 24. Votează, trimite bilete, descarcă.",
  metadataBase: new URL("https://aifm.ro"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AIFM",
  },
  openGraph: {
    title: "AIFM – Radio AI Românesc",
    description: "Vio nu doarme. Nici muzica.",
    type: "website",
    locale: "ro_RO",
    url: "https://aifm.ro",
  },
  icons: {
    apple: "/icon-192.png",
    icon: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={`${mono.variable} ${serif.variable} ${sans.variable}`}>
      <body className="bg-void text-bone overflow-hidden">{children}</body>
    </html>
  );
}
