"use client";
import { TopBar } from "@/components/TopBar";
import { FounderCardView } from "@/components/FounderCard";
import { FounderPass } from "@/components/FounderPass";
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
        <section className="container-app pt-5 pb-6">
          <div className="surface p-5 animate-pulse">
            <div className="h-3 w-1/3 skeleton mb-3" />
            <div className="h-3 w-2/3 skeleton" />
            <div className="h-24 w-full skeleton mt-4" />
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <TopBar title="You" subtitle="Your Founder Pass and Card" />
      <section className="container-app pt-5 pb-6">
        {/* Founder Pass: the editorial admit-one ticket. Identity object,
            shown above the structured Founder Card data. */}
        <div className="ed-rule pt-3 mb-4 flex items-baseline justify-between">
          <span className="ed-serial">No. 001 / Founder Pass</span>
          <span className="ed-serial hidden sm:inline">SS 2026</span>
        </div>
        <FounderPass
          name={card.name}
          cohort="Startup School 2026"
          venue="Chase Center, SF · July 25-26"
        />

        <div className="ed-rule pt-3 mt-8 mb-4 flex items-baseline justify-between">
          <span className="ed-serial">The four lines</span>
          <span className="ed-serial hidden sm:inline">Editable</span>
        </div>
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
