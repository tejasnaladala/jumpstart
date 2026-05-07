import type { Metadata } from "next";
import { Instrument_Serif, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/primitive/Toast";
import { MotionConfig } from "framer-motion";

// Editorial pairing. Instrument Serif for the briefing-headline feel,
// Geist for body, Geist Mono for serials and timestamps.
const display = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const body = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

// metadataBase: derived from NEXT_PUBLIC_SITE_URL so OG images/links
// resolve against the live origin. Falls back to localhost in dev. The
// hardcoded https://jumpstart.dev was wrong for closed-beta tunnels and
// for any future custom domain that isn't jumpstart.dev. For tunnel
// mode set NEXT_PUBLIC_SITE_URL to the current cloudflared URL.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3030";

export const metadata: Metadata = {
  title: "Jumpstart for Startup School 2026",
  description:
    "The unofficial pre-event matchmaker for YC Startup School 2026. Two days in person at Chase Center, July 25-26. Curated founder matches Monday, Wednesday, Friday at 9pm PT in the lead-in window.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: "Jumpstart for Startup School 2026",
    description:
      "Pre-event matchmaker for the 2-day in-person cohort at Chase Center, July 25-26.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <head>
        {/* ELU Analytics: product analytics SDK, similar shape to PostHog /
            Plausible. The signed-in identify call lives in (app)/layout.tsx
            via <EluIdentify />. See https://elu.dev for docs. Remove this
            tag and the EluIdentify component to opt out. */}
        <script async src="https://elu.dev/v1/elu_pk_live_QqJ0wzIYwSSK0QrXdo386FMkO3.js" />
      </head>
      <body className="min-h-svh">
        <MotionConfig reducedMotion="user">
          <ToastProvider>{children}</ToastProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
