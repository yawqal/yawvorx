import type { Config } from "tailwindcss";

// DESIGN TOKENS: change brand colors here (and the matching CSS variables in globals.css).
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        obsidian: { DEFAULT: "#fbf4ec", 900: "#19110e", 800: "#f1e1d2", 700: "#d9b595" },
        brand: { DEFAULT: "#633a28", soft: "#442d1f", bright: "#b87447" },
        secondary: { DEFAULT: "#b37f5a", soft: "#895a3e" },
        ink: { DEFAULT: "#19110e", mute: "#895a3e" },
        line: "#d9b595",
        red: { 300: "#633a28" },
        amber: { 200: "#b37f5a", 300: "#b37f5a" },
        emerald: { 300: "#633a28" },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 12px 30px -18px rgba(99,58,40,0.38)",
        depth: "0 24px 55px -38px rgba(25,17,14,0.28)",
      },
    },
  },
  plugins: [],
};
export default config;
