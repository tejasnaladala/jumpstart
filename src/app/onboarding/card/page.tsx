"use client";
import { Button } from "@/components/primitive/Button";
import { Textarea } from "@/components/primitive/Input";
import { Pill } from "@/components/primitive/Pill";
import { Avatar } from "@/components/primitive/Avatar";
import { StepDots } from "@/components/ProgressBar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveMe, DEFAULT_ME } from "@/lib/mock/me";
import type { FounderCard } from "@/lib/types";
import { extractTags, synthesizeCardLocal } from "@/lib/agents/synthesize-local";
import { useToast } from "@/components/primitive/Toast";

export default function CardReviewStep() {
  const router = useRouter();
  const toast = useToast();
  const [card, setCard] = useState<FounderCard>(DEFAULT_ME);
  const [hydrating, setHydrating] = useState(true);
  const [editing, setEditing] = useState<keyof FounderCard | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const id = JSON.parse(window.localStorage.getItem("jumpstart.onboarding.identity") || "{}");
      const ver = JSON.parse(window.localStorage.getItem("jumpstart.onboarding.verification") || "{}");
      const intent = JSON.parse(window.localStorage.getItem("jumpstart.onboarding.intent") || "{}");
      const synth = synthesizeCardLocal({ identity: id, verification: ver, intent });
      const tags = extractTags({ identity: id, intent });
      setCard({
        ...DEFAULT_ME,
        name: id.name || DEFAULT_ME.name,
        location: id.location || DEFAULT_ME.location,
        going_to_sf: !!ver?.opts?.sf,
        attended_india: !!ver?.opts?.india,
        remote_global: !!ver?.opts?.remote,
        open_to_async: !!ver?.opts?.asyncOk,
        open_to_in_person: !!ver?.opts?.inPerson,
        building_summary: synth.building,
        looking_for: synth.looking_for,
        can_help_with: synth.can_help_with,
        talk_to_me_if: synth.talk_to_me_if,
        tags: tags.length ? tags : DEFAULT_ME.tags,
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
    toast.push("Founder Card created. First Drop arrives Wednesday.", "success");
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
        <h1 className="text-2xl font-semibold tracking-tight mt-1">Your Founder Card</h1>
        <p className="text-sm text-muted mt-2">
          Drafted from your interview. Edit any line, change any tag, then save.
        </p>

        <div className="surface mt-6 p-5 rounded-2xl">
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
            </div>
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
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} />
      ) : (
        <p className="text-sm text-ink leading-relaxed">{value || <span className="text-muted italic">No answer yet.</span>}</p>
      )}
    </div>
  );
}
