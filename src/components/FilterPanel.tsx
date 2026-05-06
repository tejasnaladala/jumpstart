"use client";
import { useMemo } from "react";
import { Pill } from "@/components/primitive/Pill";
import { COHORT_TAGS, MOCK_COHORT } from "@/lib/mock/cohort";

type Props = {
  selected: string[];
  onToggle: (tag: string) => void;
  onClear?: () => void;
};

// Tags that occur on >50% of the cohort and so do not actually filter
// anything. Demoted to "atmosphere" status: shown in muted style with
// the count exposed so the user knows the filter is effectively a no-op.
// Closes DX top finding (ai-agents on 87% of cohort = filter does nothing).
const ATMOSPHERE_THRESHOLD = 0.5;

export function FilterPanel({ selected, onToggle, onClear }: Props) {
  // Per-tag counts so the user knows in advance what filtering will
  // return. Closes DX nice-to-have ("filter and see" friction).
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tag of COHORT_TAGS) {
      map[tag.value] = MOCK_COHORT.filter((c) => c.tags.includes(tag.value)).length;
    }
    return map;
  }, []);

  const total = MOCK_COHORT.length;

  const groups = COHORT_TAGS.reduce<Record<string, typeof COHORT_TAGS>>((acc, t) => {
    (acc[t.group] ??= []).push(t);
    return acc;
  }, {});

  return (
    <div className="surface p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xxs uppercase tracking-wider text-muted font-semibold">
          Filter by tag
        </p>
        {selected.length > 0 ? (
          <button
            onClick={onClear}
            className="text-xs text-accent hover:underline"
          >
            Clear ({selected.length})
          </button>
        ) : null}
      </div>
      <div className="flex flex-col gap-3">
        {Object.entries(groups).map(([group, tags]) => (
          <div key={group}>
            <p className="text-xxs text-muted mb-1.5">{group}</p>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => {
                const count = counts[t.value] ?? 0;
                const isAtmosphere = count / total > ATMOSPHERE_THRESHOLD;
                return (
                  <Pill
                    key={t.value}
                    active={selected.includes(t.value)}
                    onClick={() => onToggle(t.value)}
                    size="sm"
                    className={isAtmosphere ? "opacity-60" : undefined}
                  >
                    {t.label}
                    <span className="ml-1.5 font-mono text-[9px] tabular-nums opacity-60">
                      {count}
                    </span>
                  </Pill>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted mt-4">
        {total} verified · numbers show how many founders carry each tag
      </p>
    </div>
  );
}
