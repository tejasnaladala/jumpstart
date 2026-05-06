"use client";
import { TopBar } from "@/components/TopBar";
import { FilterPanel } from "@/components/FilterPanel";
import { FounderCardView } from "@/components/FounderCard";
import { Pill } from "@/components/primitive/Pill";
import { Sheet } from "@/components/primitive/Sheet";
import { useDraftState } from "@/lib/hooks/useDraftState";
import { useMemo, useState } from "react";
import { MOCK_COHORT } from "@/lib/mock/cohort";
import Link from "next/link";

export default function BrowsePage() {
  const [filterOpen, setFilterOpen] = useState(false);
  // Persist selected tags + free-text query across sessions so a user
  // who comes back to /browse picks up their search where they left off.
  const [selected, setSelected] = useDraftState<string[]>(
    "jumpstart.browse.tags",
    [],
    { debounceMs: 200 }
  );
  const [query, setQuery] = useDraftState<string>(
    "jumpstart.browse.query",
    "",
    { debounceMs: 250 }
  );

  // Combined filter: tags AND free-text. Free-text searches across name,
  // location, building_summary, looking_for, can_help_with, talk_to_me_if,
  // and tags so a query like "voice" or "biotech" or "japan" surfaces
  // any card mentioning that token in any field.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK_COHORT.filter((c) => {
      // Tag filter (AND): every selected tag must be on the card.
      if (selected.length > 0 && !selected.every((s) => c.tags.includes(s))) {
        return false;
      }
      // Free-text filter: query must appear in at least one indexed field.
      if (q) {
        const hay = [
          c.name,
          c.location,
          c.building_summary,
          c.looking_for,
          c.can_help_with,
          c.talk_to_me_if,
          ...c.tags,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [selected, query]);

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

      <div className="container-app pt-4">
        <div className="ed-rule pt-3 flex items-baseline justify-between gap-4 mb-3">
          <span className="ed-serial">
            § Index / {filtered.length} of {MOCK_COHORT.length}
          </span>
          <span className="ed-serial hidden sm:inline">
            {selected.length === 0 && !query
              ? "All segments"
              : `${selected.length + (query ? 1 : 0)} filter${
                  selected.length + (query ? 1 : 0) === 1 ? "" : "s"
                } on`}
          </span>
        </div>

        {/* Free-text search. Combines AND with the tag filter. Debounced
            via useDraftState so the count updates as you type without
            spamming. */}
        <div className="relative">
          <span
            aria-hidden
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/70"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M11 11l3.5 3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, location, what they build, who they want to meet"
            maxLength={120}
            className="w-full h-10 pl-9 pr-9 rounded-md border border-border bg-surface text-sm text-ink placeholder:text-muted/70 focus:border-ink/30 transition-colors"
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors p-1"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 3l10 10M13 3L3 13"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

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
            <p className="text-sm text-muted">
              {query && selected.length > 0
                ? "No founders match those filters. Try removing a tag or trimming the search."
                : query
                ? `No founders match "${query}". Try a different word or check spelling.`
                : "No founders match all of those tags. Loosen the filter."}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {filtered.map((c, i) => (
              <li key={c.id}>
                <Link
                  href={`/browse/${c.id}`}
                  className="block card-interactive rounded-lg"
                >
                  <FounderCardView card={c} variant="compact" />
                </Link>
                {(i + 1) % 6 === 0 && i < filtered.length - 1 ? (
                  <div className="ed-rule pt-3 mt-3">
                    <span className="ed-serial">
                      Batch {String(Math.floor(i / 6) + 1).padStart(2, "0")} / {String(Math.floor(filtered.length / 6) + 1).padStart(2, "0")}
                    </span>
                  </div>
                ) : null}
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
