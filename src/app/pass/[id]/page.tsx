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

import { Logo } from "@/components/Logo";
import { FounderPass } from "@/components/FounderPass";
import { findById } from "@/lib/mock/cohort";
import { DEFAULT_ME } from "@/lib/mock/me";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function PublicPassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Look up by user_id or card id. Falls back to the dev card if the id
  // is the literal "me" so devs can preview their own public Pass.
  const card =
    id === "me"
      ? DEFAULT_ME
      : findById(id) ||
        (DEFAULT_ME.id === id || DEFAULT_ME.user_id === id ? DEFAULT_ME : undefined);

  if (!card) {
    notFound();
  }

  return (
    <main className="min-h-svh bg-bg text-ink flex flex-col">
      <header className="border-b border-border">
        <div className="container-wide py-4 flex items-center justify-between">
          <Logo />
          <Link
            href="/signup"
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
            <span className="font-display italic text-ink">{card.name.split(" ")[0]}</span>{" "}
            sent you their Founder Pass via Jumpstart, the unofficial pre-event matchmaker
            for YC Startup School 2026.
          </p>
          <p className="text-xs text-muted leading-relaxed">
            Two days at Chase Center, July 25-26. Two thousand attendees. The matchmaker
            handles the rest.
          </p>
          <Link
            href="/signup"
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
