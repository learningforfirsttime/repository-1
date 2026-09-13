import type { Config } from "tailwindcss";

/**
 * THE MIDNIGHT ATELIER
 *
 * A letter-writing studio after dark. The room is deep and layered; the light
 * comes from the letters themselves. Three ground tones give the dark real
 * depth (air → surface → riser), two warm accent temperatures plus one cool
 * counterlight keep it from collapsing into "dark mode with an accent."
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // the room
        midnight: "#0E1526", // the air itself
        ink: "#18203A", // raised surfaces
        slate: "#28324F", // risers, hairline borders
        // the paper
        moonpaper: "#F1E9D9", // paper, primary text
        ash: "#B9B0A0", // secondary text — 8.2:1 on midnight
        // the light
        candlelight: "#E8B15C", // warm one: flame
        wax: "#9B3A44", // warm two: sealing wax, sparing
        brass: "#A98B4F", // metal hairlines, metadata
        aether: "#7C86D8", // the cool counterlight, rare
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "Times New Roman", "serif"],
        body: ["var(--font-body)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "Courier New", "monospace"],
      },
      maxWidth: {
        content: "74rem",
        reading: "38rem",
      },
      transitionTimingFunction: {
        // "ink settling" — the one ease used everywhere
        ink: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        120: "120ms",
        240: "240ms",
        480: "480ms",
        900: "900ms",
      },
      boxShadow: {
        // paper as a light source: a warm bloom cast onto the room
        page: "0 24px 60px -28px rgba(0,0,0,0.85), 0 0 44px -20px rgba(232,177,92,0.22)",
        "page-lift":
          "0 40px 90px -32px rgba(0,0,0,0.9), 0 0 70px -18px rgba(232,177,92,0.34)",
        seal: "0 6px 18px -6px rgba(0,0,0,0.7), 0 0 20px -6px rgba(155,58,68,0.5)",
      },
      letterSpacing: {
        micro: "0.34em",
      },
    },
  },
  plugins: [],
};

export default config;
