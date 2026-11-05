import type { Config } from "tailwindcss";

// DESIGN TOKENS: change brand colors here (and the matching CSS variables in globals.css).
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        ink: { DEFAULT: "var(--color-ink)", mute: "var(--color-ink-mute)" },
        brand: { DEFAULT: "var(--color-brand)", soft: "var(--color-brand-soft)", bright: "var(--color-brand-bright)" },
        secondary: { DEFAULT: "var(--color-secondary)", soft: "var(--color-secondary-soft)" },
        line: "var(--color-line)",
        obsidian: {
          DEFAULT: "var(--color-bg)",
          700: "var(--color-panel-2)",
          800: "var(--color-panel)",
          900: "var(--color-panel)",
        },
        error: { DEFAULT: "#dc2626", soft: "#fef2f2" },
        success: { DEFAULT: "#059669", soft: "#ecfdf5" },
        warning: { DEFAULT: "#d97706", soft: "#fffbeb" },
      },
      borderRadius: {
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
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