import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Newsreader, Special_Elite } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-body",
  display: "swap",
  adjustFontFallback: false,
});

const specialElite = Special_Elite({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-type",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Auto Memory Doll — For the words you never managed to say",
  description:
    "An AI letter-writing companion. Through a brief, gentle conversation, the doll draws out what you truly mean — then writes it in your voice, only steadier. Everything runs locally; your words never leave your machine.",
  keywords: [
    "Auto Memory Doll",
    "AI letter writing",
    "letter-writing companion",
    "letters",
  ],
};

export const viewport: Viewport = {
  themeColor: "#0b0f1a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${newsreader.variable} ${specialElite.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-night focus:px-4 focus:py-2 focus:text-gold-bright"
        >
          Skip to content
        </a>
        {children}
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
