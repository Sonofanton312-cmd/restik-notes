import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-elevated": "var(--bg-elevated)",
        "bg-hover": "var(--bg-hover)",
        border: "var(--border)",
        ink: "var(--ink)",
        "ink-dim": "var(--ink-dim)",
        "ink-faint": "var(--ink-faint)",
        accent: "var(--accent)",
        "accent-2": "var(--accent-2)"
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      maxWidth: {
        prose: "72ch"
      },
      typography: () => ({
        DEFAULT: {
          css: {
            maxWidth: "none",
            color: "var(--ink)",
            a: { color: "var(--accent)" },
            code: { color: "var(--accent-2)" }
          }
        }
      })
    }
  },
  plugins: [require("@tailwindcss/typography")]
};

export default config;
