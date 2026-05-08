import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { JetBrains_Mono, Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";

// Google Analytics (GA4) measurement id. Hardcoded because it's a public
// identifier; rotating it means a new property and lost history. If we ever
// need a staging-only id we'll switch this to NEXT_PUBLIC_GA_ID.
const GA_ID = "G-RW9MMLV1FG";

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
      <body className="bg-void text-bone overflow-hidden">
        {children}
        {/*
          Google Analytics (GA4). Loaded via next/script with strategy=
          "afterInteractive" so it never blocks first paint or audio start.
          The id (gtag.js?id=...) and the inline gtag('config') call are
          deliberately split into two <Script> tags — next/script handles the
          ordering between an external src and an inline initializer.
        */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
        </Script>
      </body>
    </html>
  );
}
