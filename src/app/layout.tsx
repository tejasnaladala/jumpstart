import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/primitive/Toast";
import { MotionConfig } from "framer-motion";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jumpstart for Startup School 2026",
  description:
    "The unofficial global attendee graph for YC Startup School 2026. Curated founder matches every week.",
  metadataBase: new URL("https://jumpstart.dev"),
  openGraph: {
    title: "Jumpstart for Startup School 2026",
    description:
      "Curated founder matches every week. Built for the SS 2026 cohort.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-svh">
        <MotionConfig reducedMotion="user">
          <ToastProvider>{children}</ToastProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
