"use client";
import { TopBar } from "@/components/TopBar";
import { FounderCardView } from "@/components/FounderCard";
import { Button } from "@/components/primitive/Button";
import { Pill } from "@/components/primitive/Pill";
import { useEffect, useState } from "react";
import { loadMe, resetMe } from "@/lib/mock/me";
import type { FounderCard } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/primitive/Toast";

export default function YouPage() {
  const [card, setCard] = useState<FounderCard | null>(null);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    setCard(loadMe());
  }, []);

  function logout() {
    resetMe();
    toast.push("Card cleared. You are signed out.", "info");
    router.push("/");
  }

  if (!card) {
    return (
      <>
        <TopBar title="You" />
        <div className="container-app py-10 text-sm text-muted">Loading your card...</div>
      </>
    );
  }

  return (
    <>
      <TopBar title="You" subtitle="Your Founder Card and settings" />
      <section className="container-app pt-5 pb-6">
        <FounderCardView card={card} />

        <div className="surface mt-4 p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xxs uppercase tracking-wider text-muted font-semibold">
              Trust tier
            </p>
            <Pill size="sm" accent>
              {card.trust_tier === "verified" ? "Verified" : card.trust_tier === "peer_vouched" ? "Peer vouched" : "Provisional"}
            </Pill>
          </div>
          <p className="text-xs text-muted mt-1.5 leading-relaxed">
            {card.trust_tier === "provisional"
              ? "A reviewer will flip you to full visibility usually within 24 hours."
              : "You have full visibility across the cohort."}
          </p>
        </div>

        <div className="surface mt-3 p-2 row-divide">
          <Row href="/onboarding/card" label="Edit Founder Card" />
          <Row href="#" label="Preview as others see you" onClick={() => toast.push("Preview is identical to the card above.", "info")} />
          <Row href="#" label="Privacy and visibility" onClick={() => toast.push("Privacy controls in v1.1", "info")} />
          <Row href="#" label="Notification preferences" onClick={() => toast.push("Email digests on. SMS off.", "info")} />
        </div>

        <div className="surface mt-3 p-4">
          <p className="text-xxs uppercase tracking-wider text-muted font-semibold mb-2">
            What we do not do
          </p>
          <ul className="space-y-1 text-xs text-muted">
            <li>• Show your phone number to anyone, ever.</li>
            <li>• Display your exact location, only city.</li>
            <li>• Rank attendees publicly. No leaderboard.</li>
            <li>• Tell you how many people viewed your card.</li>
            <li>• Keep your acceptance proof beyond 24 hours after review.</li>
          </ul>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="ghost" onClick={logout} className="text-error hover:bg-error/5">
            Sign out
          </Button>
        </div>

        <p className="text-xs text-muted text-center mt-8">
          Unofficial attendee-built tool for Startup School participants. Not affiliated with Y
          Combinator.
        </p>
      </section>
    </>
  );
}

function Row({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  const inner = (
    <span className="flex items-center justify-between px-3 py-3 hover:bg-bg/50 rounded-md transition-colors">
      <span className="text-sm text-ink">{label}</span>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-muted">
        <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
  if (onClick) {
    return (
      <button onClick={onClick} className="block w-full text-left">
        {inner}
      </button>
    );
  }
  return <Link href={href}>{inner}</Link>;
}
