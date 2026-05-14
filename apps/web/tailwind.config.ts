import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", ".dark"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1440px" }
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        // Deck Light canonical palette. Inventory §A.1.
        vx: {
          paper: "var(--vx-bg)",
          surface: "var(--vx-surface)",
          "surface-2": "var(--vx-surface-2)",
          ink: "var(--vx-text)",
          "ink-muted": "var(--vx-text-muted)",
          "ink-subtle": "var(--vx-text-subtle)",
          border: "var(--vx-border)",
          "border-soft": "var(--vx-border-soft)",
          teal: "var(--vx-teal)",
          "teal-2": "var(--vx-teal-2)",
          "accent-mark": "var(--vx-accent-mark)",
          danger: "var(--vx-danger)"
        },
        ink: {
          DEFAULT: "var(--ink)",
          dim: "var(--ink-dim)",
          muted: "var(--ink-muted)",
          subtle: "var(--ink-subtle)"
        },
        bg: {
          DEFAULT: "var(--bg)",
          1: "var(--bg-elev-1)",
          2: "var(--bg-elev-2)"
        },
        rule: {
          DEFAULT: "var(--rule)",
          strong: "var(--rule-strong)",
          soft: "var(--rule-soft)"
        },
        brand: {
          DEFAULT: "var(--brand)",
          2: "var(--brand-2)",
          wash: "var(--brand-wash)"
        },
        signal: {
          good: "var(--signal-good)",
          warn: "var(--signal-warn)",
          bad: "var(--signal-bad)"
        }
      },
      fontFamily: {
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        outfit: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace"
        ],
        "jetbrains-mono": [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace"
        ]
      },
      letterSpacing: {
        editorial: "-0.02em",
        mono: "0.14em"
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      transitionTimingFunction: {
        decisive: "cubic-bezier(0.22, 1, 0.36, 1)",
        glide: "cubic-bezier(0.4, 0, 0.2, 1)"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;
