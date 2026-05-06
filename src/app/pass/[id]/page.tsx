// Public Founder Pass view. Reachable at /pass/<user_id>. Used for
// manual invites: a verified attendee can share this URL with someone
// outside the cohort (or with a fellow attendee they want to introduce
// themselves to before the system has matched them) and the recipient
// sees a read-only Pass with the sender's name, four lines, public
// link, and venue.
//
// This is a public route (not gated by the (app) layout). The (app)
// layout enforces auth via getSession; this directory sits outside it
// so the page renders for unauthenticated visitors.
//
// Hardening for closed-beta launch:
// - robots:noindex so search engines don't index private user passes
// - generateMetadata produces sender-specific OG tags so link previews
//   in iMessage / WhatsApp / Telegram show the sender's name and one
//   line, not generic site copy
// - signup link carries ?from=<id> so we can attribute referrals to
//   the inviter once the funnel is live
// - mononyms render the full name instead of an empty .split(" ")[0]

import { Logo } from "@/components/Logo";
import { FounderPass } from "@/components/FounderPass";
import { findById } from "@/lib/mock/cohort";
import { DEFAULT_ME } from "@/lib/mock/me";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { FounderCard } from "@/lib/types";

function lookup(id: string): FounderCard | undefined {
  if (id === "me") return DEFAULT_ME;
  const cohortHit = findById(id);
  if (cohortHit) return cohortHit;
  if (DEFAULT_ME.id === id || DEFAULT_ME.user_id === id) return DEFAULT_ME;
  return undefined;
}

function firstNameOf(name: string): string {
  // Mononyms (e.g. "Madonna", "Adele") — split returns [name] so
  // .split(" ")[0] still works, but a defensive trim guards against
  // weird whitespace, leading separators, etc.
  const trimmed = (name || "").trim();
  if (!trimmed) return "Someone";
  const first = trimmed.split(/\s+/)[0];
  return first || trimmed;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const card = lookup(id);
  if (!card) {
    return {
      title: "Founder Pass not found",
      robots: { index: false, follow: false },
    };
  }
  const firstName = firstNameOf(card.name);
  const oneLine = card.building_summary || `${firstName} on Jumpstart for SS 2026`;
  return {
    title: `${firstName}'s Founder Pass`,
    description: oneLine,
    // Private user pages should not be indexed. Friends-only sharing
    // by design; SEO indexing would surface unconsented PII.
    robots: { index: false, follow: false },
    openGraph: {
      title: `${firstName} sent you their Founder Pass`,
      description: oneLine,
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: `${firstName}'s Founder Pass`,
      description: oneLine,
    },
  };
}

export default async function PublicPassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const card = lookup(id);

  if (!card) {
    notFound();
  }

  const firstName = firstNameOf(card.name);
  // Referral attribution: the recipient who clicks "Get my own pass"
  // lands on /signup with ?from=<inviter_id>. Once the funnel is wired
  // for real this is the seed for the invitee→inviter graph.
  const signupHref = `/signup?from=${encodeURIComponent(id)}`;

  return (
    <main className="min-h-svh bg-bg text-ink flex flex-col">
      <header className="border-b border-border">
        <div className="container-wide py-4 flex items-center justify-between">
          <Logo />
          <Link
            href={signupHref}
            className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted hover:text-ink transition-colors"
          >
            Get my own pass
          </Link>
        </div>
      </header>

      <section className="container-wide py-12 sm:py-20 flex-1">
        <div className="ed-rule pt-3 mb-8 flex items-baseline justify-between gap-4 max-w-[720px] mx-auto">
          <span className="ed-serial">No. 001 / Founder Pass</span>
          <span className="ed-serial hidden sm:inline">Shared via Jumpstart</span>
        </div>

        <FounderPass card={card} />

        <div className="mt-10 max-w-[600px] mx-auto text-center">
          <p className="text-sm text-muted leading-relaxed mb-4">
            <span className="font-display italic text-ink">{firstName}</span>{" "}
            sent you their Founder Pass via Jumpstart, the unofficial pre-event matchmaker
            for YC Startup School 2026.
          </p>
          <p className="text-xs text-muted leading-relaxed">
            Two days at Chase Center, July 25-26. Two thousand attendees. The matchmaker
            handles the rest.
          </p>
          <Link
            href={signupHref}
            className="inline-flex items-center justify-center h-11 px-5 mt-6 rounded-md bg-ink text-bg text-sm font-medium hover:bg-espresso transition-colors"
          >
            Get my own Founder Pass
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="container-wide py-6 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Unofficial attendee-built · Not affiliated with Y Combinator
          </p>
        </div>
      </footer>
    </main>
  );
}
