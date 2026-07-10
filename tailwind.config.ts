import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: "#0B0F1A",
        "night-2": "#0F1524",
        ink: "#161E33",
        "ink-2": "#1C2540",
        parchment: "#F2E9D8",
        "parchment-2": "#E7DBC2",
        cream: "#EDE6D6",
        faded: "#9AA3B8",
        gold: "#C9A15C",
        "gold-bright": "#E4C98A",
        dusk: "#7E96BE",
        wax: "#8E3B46",
        sepia: "#2B2416",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "Georgia", "serif"],
        type: ["var(--font-type)", "Courier New", "monospace"],
      },
      maxWidth: {
        content: "72rem",
      },
      transitionTimingFunction: {
        soft: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
