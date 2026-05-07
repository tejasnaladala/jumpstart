"use client";
import { Button } from "@/components/primitive/Button";
import { Textarea } from "@/components/primitive/Input";
import { Pill } from "@/components/primitive/Pill";
import { Avatar } from "@/components/primitive/Avatar";
import { StepDots } from "@/components/ProgressBar";
import { FounderPass } from "@/components/FounderPass";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveMe, DEFAULT_ME } from "@/lib/mock/me";
import type { FounderCard } from "@/lib/types";
import { extractIntents, extractTags, synthesizeCardLocal } from "@/lib/agents/synthesize-local";
import { useToast } from "@/components/primitive/Toast";
import { eligibleDropFor, formatDropLabel } from "@/lib/drop/schedule";
import { setEligibleDrop } from "@/lib/drop/eligibility";

export default function CardReviewStep() {
  const router = useRouter();
  const toast = useToast();
  const [card, setCard] = useState<FounderCard>(DEFAULT_ME);
  const [hydrating, setHydrating] = useState(true);
  const [editing, setEditing] = useState<keyof FounderCard | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // If the user has previously saved their card and is now re-visiting
    // /onboarding/card (because they bookmarked it, came back to edit a
    // line, or hit refresh), hydrate from the saved Pass instead of
    // re-synthesizing from onboarding drafts. Otherwise the synth pass
    // silently overwrites every line they hand-edited the last time
    // through. Closes returning-user agent finding.
    try {
      const savedRaw = window.localStorage.getItem("jumpstart.me");
      if (savedRaw) {
        const saved = JSON.parse(savedRaw) as FounderCard;
        if (saved && typeof saved === "object" && saved.name) {
          setCard(saved);
          setHydrating(false);
          return;
        }
      }
    } catch {
      // fall through to synthesis from drafts
    }
    try {
      // useDraftState wraps stored state in a versioned envelope:
      // { v: 1, ts, data }. Unwrap before synthesis. Falls back to {}
      // when the key is missing or the envelope is unparseable.
      const readDraft = (key: string): Record<string, unknown> => {
        const raw = window.localStorage.getItem(key);
        if (!raw) return {};
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object" && "v" in parsed && "data" in parsed) {
            return (parsed.data as Record<string, unknown>) ?? {};
          }
          // legacy un-enveloped format (intent step before useDraftState
          // landed). Treat as the data directly.
          return parsed as Record<string, unknown>;
        } catch {
          return {};
        }
      };
      const id = readDraft("jumpstart.onboarding.identity") as {
        name?: string;
        location?: string;
        oneLine?: string;
        publicLink?: string;
      };
      const ver = readDraft("jumpstart.onboarding.verification") as {
        opts?: {
          sf?: boolean;
          india?: boolean;
          remote?: boolean;
          asyncOk?: boolean;
          inPerson?: boolean;
        };
      };
      const intent = readDraft("jumpstart.onboarding.intent") as Record<string, string>;
      const synth = synthesizeCardLocal({ identity: id, verification: ver, intent });
      const tags = extractTags({ identity: id, intent });
      const intents = extractIntents({ identity: id, intent });
      // Per-user id/user_id derived from email so two new users on the
      // same machine don't collide on "fc_me" / "u_me". Closes the
      // DEFAULT_ME bleed-through where every new card inherited Tejas's
      // identity, intents, and tags.
      const signupRaw = window.localStorage.getItem("jumpstart.signup");
      let derivedSlug = "self";
      try {
        const signup = signupRaw ? JSON.parse(signupRaw) : {};
        const emailSeed = (signup?.email || id.name || "").toString();
        derivedSlug = emailSeed
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 24) || "self";
      } catch {
        // fall through with default slug
      }
      setCard({
        id: `fc_${derivedSlug}`,
        user_id: `u_${derivedSlug}`,
        name: id.name || "",
        location: id.location || "",
        going_to_sf: !!ver?.opts?.sf,
        attended_india: !!ver?.opts?.india,
        remote_global: !!ver?.opts?.remote,
        open_to_async: !!ver?.opts?.asyncOk,
        open_to_in_person: !!ver?.opts?.inPerson,
        building_summary: synth.building,
        looking_for: synth.looking_for,
        can_help_with: synth.can_help_with,
        talk_to_me_if: synth.talk_to_me_if,
        // Tags + intents come from the user's actual signal. Empty is
        // a valid state - TagAdder lets them add manually on this page.
        tags,
        intents,
        // Public link survives from the identity step into the saved card.
        public_link: id.publicLink || undefined,
        trust_tier: "provisional",
        updated_at: new Date().toISOString(),
      });
    } catch {
      // fall back to default
    } finally {
      setHydrating(false);
    }
  }, []);

  function finalize() {
    saveMe(card);
    // Compute eligible drop time using the 6-hour cutoff rule:
    //   - finished onboarding before 3pm PT on a drop day -> tonight's 9pm drop
    //   - finished onboarding at/after 3pm PT on a drop day -> next drop day
    const eligibleAt = eligibleDropFor(new Date());
    setEligibleDrop(eligibleAt);
    toast.push(
      `Founder Pass saved. Your first match drops ${formatDropLabel(eligibleAt)}.`,
      "success"
    );
    router.push("/drop");
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="container-app pt-6 pb-3">
        <StepDots current={4} total={4} />
      </div>
      <div className="container-app flex-1 pb-32">
        <p className="text-xxs uppercase tracking-wider text-accent font-semibold mt-3">
          Step 4 of 4
        </p>
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-ink leading-[1.05] mt-2">Your Founder Pass</h1>
        <p className="text-sm text-muted mt-2">
          Drafted from your interview. Edit any line, change any tag, then save. The pass is what
          other verified attendees see when the matchmaker scores you against them.
        </p>

        {/* Live FounderPass preview, identity-only mode (no four-line content
            on the face). Pulls the moment-of-delight forward by one screen
            so the user sees their admit-one ticket take shape during
            onboarding rather than waiting until /you. Closes DX top fix #5. */}
        <div className="mt-6 mb-8">
          <FounderPass card={card} />
        </div>

        <p className="ed-serial mb-3">Edit the four lines below</p>

        <div className="surface mt-2 p-5 rounded-2xl">
          <div className="flex items-center gap-3">
            <Avatar name={card.name} size={52} />
            <div>
              <h2 className="text-lg font-semibold">{card.name}</h2>
              <p className="text-sm text-muted">{card.location}</p>
            </div>
          </div>

          <EditableSection
            label="Building"
            value={card.building_summary}
            onChange={(v) => setCard((c) => ({ ...c, building_summary: v }))}
            editing={editing === "building_summary"}
            onEdit={() => setEditing(editing === "building_summary" ? null : "building_summary")}
          />
          <EditableSection
            label="Looking for"
            value={card.looking_for}
            onChange={(v) => setCard((c) => ({ ...c, looking_for: v }))}
            editing={editing === "looking_for"}
            onEdit={() => setEditing(editing === "looking_for" ? null : "looking_for")}
          />
          <EditableSection
            label="Can help with"
            value={card.can_help_with}
            onChange={(v) => setCard((c) => ({ ...c, can_help_with: v }))}
            editing={editing === "can_help_with"}
            onEdit={() => setEditing(editing === "can_help_with" ? null : "can_help_with")}
          />
          <EditableSection
            label="Talk to me if"
            value={card.talk_to_me_if}
            onChange={(v) => setCard((c) => ({ ...c, talk_to_me_if: v }))}
            editing={editing === "talk_to_me_if"}
            onEdit={() => setEditing(editing === "talk_to_me_if" ? null : "talk_to_me_if")}
          />

          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-xxs uppercase tracking-wider text-muted font-semibold mb-2">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {card.tags.map((t) => (
                <Pill key={t} active size="sm" onClick={() => setCard((c) => ({ ...c, tags: c.tags.filter((x) => x !== t) }))}>
                  {t} ×
                </Pill>
              ))}
              {card.tags.length === 0 ? (
                <span className="text-xs text-muted italic">No tags yet - add a few below.</span>
              ) : null}
            </div>
            {/* Free-text tag input. Tags drive matching, browse filters,
                and the Pass display, so users need a real way to add
                them - clicking pills only removed before. Normalize
                aggressively so "AI Agents" / "ai-agents" / "ai agents"
                all collapse to one canonical form. Cap at 12 to keep
                the Pass legible (FounderPass.tsx renders the first 6). */}
            <TagAdder
              existing={card.tags}
              onAdd={(t) =>
                setCard((c) => (c.tags.includes(t) ? c : { ...c, tags: [...c.tags, t] }))
              }
            />
          </div>
        </div>

        <p className="text-xs text-muted mt-5 leading-relaxed">
          Trust tier: <span className="font-semibold text-ink">provisional</span>. Full visibility unlocks
          after a reviewer flips your verification, usually under 24 hours. You can use everything in
          the meantime except sending intros.
        </p>

        {hydrating ? (
          <p className="text-xs text-muted mt-4">Drafting from your answers...</p>
        ) : null}
      </div>
      <div className="border-t border-border bg-surface sticky bottom-0">
        <div className="container-app py-3 flex items-center justify-between gap-2">
          <span className="text-xs text-muted">Card review</span>
          <Button onClick={finalize}>Save and see Drop preview</Button>
        </div>
      </div>
    </div>
  );
}

function TagAdder({
  existing,
  onAdd,
}: {
  existing: string[];
  onAdd: (tag: string) => void;
}) {
  const [val, setVal] = useState("");
  const MAX_TAGS = 12;
  const atCap = existing.length >= MAX_TAGS;

  function normalize(raw: string): string {
    return raw
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 24);
  }

  function commit() {
    const t = normalize(val);
    if (!t || t.length < 2) {
      setVal("");
      return;
    }
    if (existing.includes(t)) {
      setVal("");
      return;
    }
    onAdd(t);
    setVal("");
  }

  return (
    <div className="mt-3 flex items-center gap-2">
      <input
        type="text"
        placeholder={atCap ? `Cap reached (${MAX_TAGS})` : "Add tag, e.g. ai-agents"}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
        disabled={atCap}
        maxLength={24}
        className="text-xs px-3 py-1.5 rounded-md border border-border bg-bg text-ink placeholder:text-muted/70 focus:outline-none focus:border-ink disabled:opacity-60"
      />
      <button
        type="button"
        onClick={commit}
        disabled={atCap || normalize(val).length < 2}
        className="text-xs px-3 py-1.5 rounded-md bg-ink text-bg font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-espresso transition-colors"
      >
        Add
      </button>
    </div>
  );
}

function EditableSection({
  label,
  value,
  onChange,
  editing,
  onEdit,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  editing: boolean;
  onEdit: () => void;
}) {
  return (
    <div className="mt-5 pt-4 border-t border-border">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xxs uppercase tracking-wider text-muted font-semibold">{label}</p>
        <button onClick={onEdit} className="text-xs text-accent hover:underline">
          {editing ? "Done" : "Edit"}
        </button>
      </div>
      {editing ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          maxLength={220}
          showCounter
        />
      ) : (
        <p className="text-sm text-ink leading-relaxed">{value || <span className="text-muted italic">No answer yet.</span>}</p>
      )}
    </div>
  );
}
