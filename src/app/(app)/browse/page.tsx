"use client";
import { TopBar } from "@/components/TopBar";
import { FilterPanel } from "@/components/FilterPanel";
import { FounderCardView } from "@/components/FounderCard";
import { Pill } from "@/components/primitive/Pill";
import { Sheet } from "@/components/primitive/Sheet";
import { useMemo, useState } from "react";
import { MOCK_COHORT } from "@/lib/mock/cohort";
import Link from "next/link";

export default function BrowsePage() {
  const [filterOpen, setFilterOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => {
    if (selected.length === 0) return MOCK_COHORT;
    return MOCK_COHORT.filter((c) => selected.every((s) => c.tags.includes(s)));
  }, [selected]);

  function toggle(tag: string) {
    setSelected((s) => (s.includes(tag) ? s.filter((x) => x !== tag) : [...s, tag]));
  }

  return (
    <>
      <TopBar
        title="Browse"
        subtitle={`${filtered.length} founders`}
        right={
          <button
            onClick={() => setFilterOpen(true)}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors ${selected.length > 0 ? "border-ink bg-ink text-white" : "border-border text-muted hover:border-ink/40"}`}
            aria-label="Filter"
          >
            <FilterIcon />
            {selected.length > 0 ? (
              <span className="absolute -mt-6 ml-5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent text-white text-xxs px-1">
                {selected.length}
              </span>
            ) : null}
          </button>
        }
      />

      {selected.length > 0 ? (
        <div className="container-app pt-3">
          <div className="flex flex-wrap gap-1.5">
            {selected.map((s) => (
              <Pill key={s} active size="sm" onClick={() => toggle(s)}>
                {s} ×
              </Pill>
            ))}
            <button
              onClick={() => setSelected([])}
              className="text-xs text-accent ml-1 hover:underline"
            >
              Clear all
            </button>
          </div>
        </div>
      ) : null}

      <section className="container-app pt-5 pb-6">
        {filtered.length === 0 ? (
          <div className="surface p-8 text-center">
            <p className="text-sm text-muted">No founders match all of those tags. Loosen the filter.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {filtered.map((c) => (
              <li key={c.id}>
                <Link href={`/browse/${c.id}`} className="block transition-all hover:-translate-y-px">
                  <FounderCardView card={c} variant="compact" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Sheet open={filterOpen} onClose={() => setFilterOpen(false)} title="Filter" size="lg">
        <FilterPanel
          selected={selected}
          onToggle={toggle}
          onClear={() => setSelected([])}
        />
      </Sheet>
    </>
  );
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M1.5 3h13M3.5 8h9M5.5 13h5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
