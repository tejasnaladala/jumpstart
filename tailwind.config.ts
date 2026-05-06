import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Pulled from the YC Startup School 2026 events stylesheet
        // (bookface-static.ycombinator.com/vite/assets/tailwind-*.css).
        bg: "#F4F1DB", // warm cream, the SS hero background
        surface: "#FDFDF8", // pale off-white for cards and sheets
        ink: "#16140F", // warm near-black, primary text
        muted: "#463325", // warm dark brown, secondary text
        border: "#E8E3CC", // tinted divider derived from the cream
        accent: "#FF6600", // the iconic YC orange
        "accent-soft": "#FFF0E9", // pale peach for accent backgrounds
        "accent-edge": "#FB651E", // hotter orange for hovers and edges
        // Espresso scale for dark sections (footer band, hero contrast strips,
        // big-typography surfaces). Used as the inverted background color.
        espresso: {
          DEFAULT: "#2D2417",
          deep: "#1F1A11",
          warm: "#3A2C1C",
        },
        success: "#48B584",
        error: "#E4544B",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      fontSize: {
        xxs: ["10px", { lineHeight: "14px" }],
        xs: ["11px", { lineHeight: "16px" }],
        sm: ["13px", { lineHeight: "18px" }],
        base: ["14px", { lineHeight: "20px" }],
        lg: ["16px", { lineHeight: "22px" }],
        xl: ["18px", { lineHeight: "26px" }],
        "2xl": ["22px", { lineHeight: "28px" }],
        "3xl": ["28px", { lineHeight: "34px" }],
        "4xl": ["36px", { lineHeight: "42px" }],
        "5xl": ["48px", { lineHeight: "54px" }],
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        DEFAULT: "8px",
        md: "10px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(26,26,26,0.04), 0 1px 1px rgba(26,26,26,0.02)",
        hover: "0 4px 12px rgba(26,26,26,0.08), 0 1px 2px rgba(26,26,26,0.04)",
        focus: "0 0 0 3px rgba(196,86,18,0.18)",
      },
      animation: {
        "fade-up": "fadeUp 320ms cubic-bezier(0.16,1,0.3,1)",
        "fade-in": "fadeIn 220ms ease-out",
        shimmer: "shimmer 1.6s linear infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        shimmer: {
          "0%": { backgroundPosition: "-468px 0" },
          "100%": { backgroundPosition: "468px 0" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-33.333%)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
