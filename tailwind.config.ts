import type { Config } from "tailwindcss";

// DESIGN TOKENS: change brand colors here (and the matching CSS variables in globals.css).
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        obsidian: { DEFAULT: "#07080B", 900: "#0B0D12", 800: "#11141B", 700: "#1A1E28" },
        cyan: { DEFAULT: "#22D3EE", soft: "#67E8F9" },
        violet: { DEFAULT: "#8B5CF6", soft: "#A78BFA" },
        ink: { DEFAULT: "#F4F6FA", mute: "#9AA3B2" },
        line: "rgba(255,255,255,0.09)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(34,211,238,0.25), 0 8px 32px -8px rgba(34,211,238,0.25)",
        depth: "0 20px 40px -24px rgba(0,0,0,0.8)",
      },
    },
  },
  plugins: [],
};
export default config;
