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

export const metadata: Metadata = {
  title: "Jumpstart for Startup School 2026",
  description:
    "The unofficial global attendee graph for YC Startup School 2026. Curated founder matches Monday, Wednesday, Friday at 09:00 PT.",
  metadataBase: new URL("https://jumpstart.dev"),
  openGraph: {
    title: "Jumpstart for Startup School 2026",
    description:
      "Curated founder matches every other day. Built for the SS 2026 cohort.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="min-h-svh">
        <MotionConfig reducedMotion="user">
          <ToastProvider>{children}</ToastProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
