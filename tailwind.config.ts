import type { Config } from "tailwindcss";

// DESIGN TOKENS: change brand colors here (and the matching CSS variables in globals.css).
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        obsidian: { DEFAULT: "#07080B", 900: "#0E1016", 800: "#12151D", 700: "#1B202B" },
        cyan: { DEFAULT: "#22D3EE", soft: "#67E8F9" },
        violet: { DEFAULT: "#8B5CF6", soft: "#A78BFA" },
        ink: { DEFAULT: "#F5F7FA", mute: "#A1A7B4" },
        line: "#252A36",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 10px 30px -16px rgba(139,92,246,0.45)",
        depth: "0 24px 48px -32px rgba(0,0,0,0.9)",
      },
    },
  },
  plugins: [],
};
export default config;
