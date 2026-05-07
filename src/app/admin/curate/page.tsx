"use client";
import { TopBar } from "@/components/TopBar";
import { Avatar } from "@/components/primitive/Avatar";
import { Button } from "@/components/primitive/Button";
import { Pill } from "@/components/primitive/Pill";
import { useEffect, useState } from "react";
import { loadMe } from "@/lib/mock/me";
import { MOCK_COHORT } from "@/lib/mock/cohort";
import {
  buildCuratedMatch,
  deliverMatch,
  findPendingDeliveries,
  type PendingDelivery,
} from "@/lib/drop/delivery";
import type { FounderCard, MatchType } from "@/lib/types";

// Admin curation surface. Closed-beta posture: founder hand-picks every
// match for the first ~50 users. This page lists pending deliveries
// (users whose countdown has reached zero), shows a candidate picker
// from MOCK_COHORT (or eventually the real cohort), and ships the chosen
// match into localStorage where /drop picks it up.

const MATCH_TYPES: { key: MatchType; label: string }[] = [
  { key: "domain_peer", label: "Domain peer" },
  { key: "cofounder_shape", label: "Cofounder shape" },
  { key: "weird_adjacent", label: "Weird adjacent" },
  { key: "city_match", label: "City match" },
];

export default function CuratePage() {
  const [pending, setPending] = useState<PendingDelivery[]>([]);
  const [selected, setSelected] = useState<PendingDelivery | null>(null);

  function refresh() {
    const me = loadMe();
    setPending(findPendingDeliveries(me));
  }

  useEffect(() => {
    refresh();
  }, []);

  if (selected) {
    return (
      <CuratorView
        delivery={selected}
        onCancel={() => setSelected(null)}
        onDelivered={() => {
          setSelected(null);
          refresh();
        }}
      />
    );
  }

  return (
    <>
      <TopBar
        variant="compact"
        title="Curate matches"
        subtitle={`${pending.length} pending in the next 9pm PT slot`}
      />
      <section className="container-app pt-6 pb-12">
        {pending.length === 0 ? (
          <div className="surface p-6 text-center">
            <p className="text-sm font-semibold text-ink mb-1">No pending deliveries</p>
            <p className="text-xs text-muted leading-relaxed">
              When a user&apos;s countdown reaches zero and no match has been
              delivered yet, their card lands here. The 6-hour buffer (3pm PT
              cutoff) gives you time to curate before the 9pm PT drop.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {pending.map((p) => (
              <li
                key={p.storage_key}
                className="surface p-4 flex items-start gap-3"
              >
                <Avatar name={p.user_name} size={44} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">{p.user_name}</p>
                  {p.user_card ? (
                    <>
                      <p className="text-xs text-muted truncate mt-0.5">
                        {p.user_card.location}
                      </p>
                      <p className="text-xs text-ink mt-2 leading-relaxed line-clamp-2">
                        {p.user_card.building_summary}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.user_card.tags.slice(0, 5).map((t) => (
                          <Pill key={t} size="sm" active>
                            {t}
                          </Pill>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
                <Button size="sm" onClick={() => setSelected(p)}>
                  Curate
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 surface p-4">
          <p className="text-xxs uppercase tracking-wider text-muted font-semibold mb-2">
            How this works
          </p>
          <ul className="text-xs text-muted space-y-1.5 leading-relaxed">
            <li>
              · A user&apos;s countdown reaches 9pm PT. Their card lands here.
            </li>
            <li>
              · You pick a candidate from the cohort, write the &ldquo;why you should
              meet&rdquo; line, and ship.
            </li>
            <li>
              · The match appears on their /drop next refresh, with a browser
              notification firing once.
            </li>
            <li>
              · Closed-beta posture: localStorage-bound, scoped to your browser.
              Real multi-user curation comes with PocketBase backend.
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}

function CuratorView({
  delivery,
  onCancel,
  onDelivered,
}: {
  delivery: PendingDelivery;
  onCancel: () => void;
  onDelivered: () => void;
}) {
  const [candidate, setCandidate] = useState<FounderCard | null>(null);
  const [matchType, setMatchType] = useState<MatchType>("domain_peer");
  const [explanation, setExplanation] = useState("");
  const [opener, setOpener] = useState("");
  const [delivering, setDelivering] = useState(false);

  const me = delivery.user_card;
  const candidates = MOCK_COHORT.filter(
    (c) => me === null || (c.id !== me.id && c.user_id !== me.user_id)
  );

  // Auto-suggest explanation + opener once a candidate is picked.
  useEffect(() => {
    if (!candidate || !me) return;
    const overlap = me.tags.find((t) => candidate.tags.includes(t));
    const candidateName = candidate.name.split(" ")[0] || candidate.name;
    if (overlap) {
      setExplanation(
        `${candidateName} works on ${overlap.replace(/-/g, " ")} from a different angle than you. Worth a 30-min call.`
      );
      setOpener(
        `${candidateName} - we both put ${overlap.replace(/-/g, " ")} on our cards. 20 min before SS?`
      );
    } else {
      setExplanation(
        `${candidateName} is in adjacent territory. Different angle, similar shape of problem.`
      );
      setOpener(
        `${candidateName} - the way you described what you're building grabbed me. Worth a 20-min call?`
      );
    }
  }, [candidate, me]);

  function deliver() {
    if (!candidate || !me) return;
    setDelivering(true);
    try {
      const match = buildCuratedMatch({
        me,
        candidate,
        match_type: matchType,
        explanation,
        suggested_opener: opener,
        drop_iso: delivery.drop_iso,
      });
      deliverMatch(delivery.drop_iso, match);
      onDelivered();
    } finally {
      setDelivering(false);
    }
  }

  return (
    <>
      <TopBar
        variant="compact"
        back={{ href: "/admin/curate" }}
        title={`Curate for ${delivery.user_name}`}
      />
      <section className="container-app pt-6 pb-12">
        {/* User card preview */}
        {me ? (
          <div className="surface p-4 mb-5">
            <p className="text-xxs uppercase tracking-wider text-muted font-semibold mb-2">
              Curating for
            </p>
            <div className="flex items-start gap-3">
              <Avatar name={me.name} size={44} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink">{me.name}</p>
                <p className="text-xs text-muted truncate">{me.location}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 text-xs">
              <p className="text-muted">
                <span className="font-mono uppercase tracking-wider opacity-70">
                  Building:
                </span>{" "}
                {me.building_summary}
              </p>
              <p className="text-muted">
                <span className="font-mono uppercase tracking-wider opacity-70">
                  Looking for:
                </span>{" "}
                {me.looking_for}
              </p>
            </div>
            <div className="flex flex-wrap gap-1 mt-3">
              {me.tags.map((t) => (
                <Pill key={t} size="sm" active>
                  {t}
                </Pill>
              ))}
            </div>
          </div>
        ) : null}

        {/* Candidate picker */}
        <p className="text-xxs uppercase tracking-wider text-muted font-semibold mb-2">
          Pick a candidate ({candidates.length} in cohort)
        </p>
        <div className="grid grid-cols-1 gap-2 mb-5">
          {candidates.map((c) => (
            <button
              key={c.id}
              onClick={() => setCandidate(c)}
              className={`surface p-3 text-left transition-colors flex items-start gap-3 ${
                candidate?.id === c.id
                  ? "border-accent bg-accent/5"
                  : "hover:border-ink/40"
              }`}
            >
              <Avatar name={c.name} size={36} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-ink truncate">
                    {c.name}
                  </span>
                  <span className="text-xxs text-muted">{c.location}</span>
                </div>
                <p className="text-xs text-muted line-clamp-2 mt-1 leading-relaxed">
                  {c.building_summary}
                </p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {c.tags.slice(0, 4).map((t) => (
                    <span
                      key={t}
                      className="text-xxs font-mono uppercase tracking-wider text-muted opacity-70"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Explanation + opener */}
        {candidate ? (
          <div className="surface p-4 flex flex-col gap-3">
            <div>
              <p className="text-xxs uppercase tracking-wider text-muted font-semibold mb-2">
                Match type
              </p>
              <div className="flex flex-wrap gap-1.5">
                {MATCH_TYPES.map((mt) => (
                  <Pill
                    key={mt.key}
                    size="sm"
                    active={matchType === mt.key}
                    onClick={() => setMatchType(mt.key)}
                  >
                    {mt.label}
                  </Pill>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xxs uppercase tracking-wider text-muted font-semibold mb-1">
                Why you should meet
              </p>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                rows={3}
                maxLength={400}
                className="w-full text-sm px-3 py-2 rounded-md border border-border bg-bg text-ink focus:outline-none focus:border-ink resize-y leading-relaxed"
              />
            </div>
            <div>
              <p className="text-xxs uppercase tracking-wider text-muted font-semibold mb-1">
                Suggested opener
              </p>
              <textarea
                value={opener}
                onChange={(e) => setOpener(e.target.value)}
                rows={3}
                maxLength={400}
                className="w-full text-sm px-3 py-2 rounded-md border border-border bg-bg text-ink focus:outline-none focus:border-ink resize-y leading-relaxed"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={deliver}
                loading={delivering}
                disabled={!candidate || !explanation.trim() || !opener.trim()}
              >
                Deliver match
              </Button>
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
