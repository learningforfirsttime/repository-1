import type { Metadata, Viewport } from "next";
import { Fraunces, Newsreader, Courier_Prime } from "next/font/google";
import "./globals.css";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GrainOverlay from "@/components/effects/GrainOverlay";
import InkFilters from "@/components/effects/InkFilters";
import ClientEffects from "@/components/effects/ClientEffects";
import { RequestProvider } from "@/lib/request";

/**
 * Type. Fraunces carries the display voice — its optical-size and WONK axes
 * are what keep the headlines from reading like every other serif revival.
 * Newsreader sets the body. Courier Prime handles anything with typewriter
 * DNA: microlabels, session notes, controls.
 *
 * All three are self-hosted at build time by next/font. Nothing is fetched at
 * runtime. If a build environment could not reach them, deleting these three
 * declarations and the `className` below drops the site onto the tuned
 * Georgia / Courier New stacks already wired into tailwind.config.ts.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "WONK", "opsz"],
  variable: "--font-display",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-body",
  display: "swap",
  adjustFontFallback: false,
});

const courierPrime = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Auto Memory Doll — For the words you never managed to say",
    template: "%s · Auto Memory Doll",
  },
  description:
    "A letter-writing atelier. Through a brief, gentle conversation your Auto Memory Doll draws out what you actually mean, then writes it in your voice — only steadier. Everything runs locally; your words never leave your machine.",
  applicationName: "Auto Memory Doll",
  keywords: [
    "letter writing",
    "auto memory doll",
    "letters",
    "gratitude letter",
    "reconciliation letter",
  ],
  authors: [{ name: "Auto Memory Doll" }],
  openGraph: {
    title: "Auto Memory Doll — For the words you never managed to say",
    description:
      "The doll listens before she writes. A short conversation, then a letter in your voice.",
    type: "website",
    locale: "en",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0E1526",
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${newsreader.variable} ${courierPrime.variable}`}
    >
      <body className="flex min-h-screen flex-col">
        <RequestProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[3px] focus:border focus:border-candlelight focus:bg-midnight focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:tracking-[0.2em] focus:text-candlelight"
          >
            Skip to content
          </a>

          <Header />
          {children}
          <Footer />

          <InkFilters />
          <GrainOverlay />
          <ClientEffects />
        </RequestProvider>
      </body>
    </html>
  );
}
