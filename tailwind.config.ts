import type { Config } from "tailwindcss";

// DESIGN TOKENS: change brand colors here (and the matching CSS variables in globals.css).
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        obsidian: { DEFAULT: "#F5F6FA", 900: "#FFFFFF", 800: "#EEF0F7", 700: "#E5E8F0" },
        cyan: { DEFAULT: "#207282", soft: "#176E80", bright: "#54C9DD" },
        violet: { DEFAULT: "#7657E8", soft: "#6245CF" },
        ink: { DEFAULT: "#171923", mute: "#626779" },
        line: "#E2E5EE",
        red: { 300: "#C93C50" },
        amber: { 200: "#8A5608", 300: "#8A5608" },
        emerald: { 300: "#168B64" },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 12px 30px -18px rgba(118,87,232,0.38)",
        depth: "0 24px 55px -38px rgba(34,38,57,0.28)",
      },
    },
  },
  plugins: [],
};
export default config;
