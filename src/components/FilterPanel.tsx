"use client";
import { Pill } from "@/components/primitive/Pill";
import { COHORT_TAGS } from "@/lib/mock/cohort";

type Props = {
  selected: string[];
  onToggle: (tag: string) => void;
  onClear?: () => void;
};

export function FilterPanel({ selected, onToggle, onClear }: Props) {
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
              {tags.map((t) => (
                <Pill
                  key={t.value}
                  active={selected.includes(t.value)}
                  onClick={() => onToggle(t.value)}
                  size="sm"
                >
                  {t.label}
                </Pill>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
