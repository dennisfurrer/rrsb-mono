import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "var(--brand)",
          dim: "var(--brand-dim)",
          text: "var(--brand-text)",
          glow: "var(--brand-glow)",
        },
        surface: {
          "0": "var(--surface-0)",
          "1": "var(--surface-1)",
          "2": "var(--surface-2)",
          "3": "var(--surface-3)",
        },
        sidebar: "var(--sidebar)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
          subtle: "var(--border-subtle)",
        },
        success: "var(--success)",
        danger: "var(--danger)",
        warning: "var(--warning)",
        info: "var(--info)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
        display: ["var(--font-sora)", "var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: ["0.9375rem", { lineHeight: "1.375rem" }],
        sm: ["1.09375rem", { lineHeight: "1.5rem" }],
        base: ["1.25rem", { lineHeight: "1.75rem" }],
        lg: ["1.40625rem", { lineHeight: "2rem" }],
        xl: ["1.5625rem", { lineHeight: "2.125rem" }],
        "2xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "3xl": ["2.34375rem", { lineHeight: "2.75rem" }],
        "4xl": ["2.8125rem", { lineHeight: "1" }],
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
        xl: "0.75rem",
      },
    },
  },
  plugins: [],
};

export default config;
