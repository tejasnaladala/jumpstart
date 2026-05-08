import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // == YC Startup School 2026 base palette ==
        // Pulled directly from the YC SS 2026 events stylesheet
        // (bookface-static.ycombinator.com/vite/assets/tailwind-*.css).
        bg: "#F4F1DB", // warm cream, the SS hero background
        surface: "#FDFDF8", // pale off-white for cards and sheets
        ink: "#16140F", // warm near-black, primary text
        muted: "#463325", // warm dark brown, secondary text
        border: "#E8E3CC", // tinted divider derived from the cream
        // Orange palette toned down 1-2 shades from the strict YC #FF6600
        // (founder felt the neon was too hot vs the YC SS site's actual
        // rendered orange, which sits a touch darker / more amber).
        accent: "#E85A1B", // toned from #FF6600 — still YC-coded, less neon
        "accent-soft": "#FCEAE0", // pale peach (slightly cooler now)
        "accent-edge": "#CC4E15", // hover state — deeper, warmer
        // accent-text: still passes WCAG AA on cream. Pulled deeper to
        // match the new accent's reduced saturation.
        "accent-text": "#8C2F00",
        // accent-wash: 10% orange tint for card backgrounds.
        "accent-wash": "#FBE0CD",
        success: "#48B584",
        error: "#E4544B",

        // == Jumpstart brand extensions (NOT from YC palette) ==
        // These are extra shades layered on top of the YC base for editorial
        // depth. Inspired by huashu-design (Chinese editorial restraint,
        // ink-stamp orange) and taste-skill (espresso depth scale, layered
        // surfaces). They are derived from the YC base hues, not introduced
        // as new colors. If you want a stricter YC-only render, prefer the
        // base tokens above.
        ivory: "#F8F5E3", // half-shade lighter than bg for layered cards
        "surface-deep": "#FFFCEE", // contrast surface for stacked-card depth
        "muted-soft": "#6B5840", // lighter brown for secondary chrome
        "border-strong": "#D9D2B0", // stronger divider for editorial punctuation
        stamp: "#C44C00", // deep ink-stamp orange (huashu seal motif)

        // == Espresso scale ==
        // Dark inverted-surface used in CTA blocks, marquee bands, and
        // dark-mode elements. The base #2D2417 is derived to read warm
        // alongside the YC cream. Three sub-shades give layered depth.
        espresso: {
          DEFAULT: "#2D2417",
          deep: "#1F1A11",
          warm: "#3A2C1C",
          // dust refined from #4A3B2A → #453622 for better text contrast on
          // espresso bg (Linear+YC SS pattern: secondary text needs ≥3:1).
          dust: "#453622",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      fontSize: {
        // Bumped xxs floor 10→11 and xs floor 11→12 to clear impeccable's
        // tiny-text rule (12px minimum for body content). Editorial mono
        // serials use xxs only as decorative chips, never as body copy.
        xxs: ["11px", { lineHeight: "15px" }],
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["13px", { lineHeight: "18px" }],
        // Body bumped from 14/20 → 15/22 for legibility at desktop widths.
        // Linear baseline body is 15-16px; Stripe is 16px. We split the
        // difference at 15px to keep our editorial density.
        base: ["15px", { lineHeight: "22px" }],
        // lg bumped from 16/22 → 17/26 for hero subhead readability.
        lg: ["17px", { lineHeight: "26px" }],
        xl: ["19px", { lineHeight: "28px" }],
        "2xl": ["22px", { lineHeight: "30px" }],
        "3xl": ["28px", { lineHeight: "36px" }],
        "4xl": ["36px", { lineHeight: "44px" }],
        "5xl": ["48px", { lineHeight: "56px" }],
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
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
