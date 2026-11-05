import type { Config } from "tailwindcss";

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
          DEFAULT: "var(--color-panel)",
          700: "var(--color-panel-2)",
          800: "#131313",
          900: "#111111",
        },
        amber: {
          DEFAULT: "#F59E0B",
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#D97706",
          600: "#B45309",
          700: "#92400E",
          800: "#78350F",
          900: "#451A03",
        },
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
        display: ["Inter", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
