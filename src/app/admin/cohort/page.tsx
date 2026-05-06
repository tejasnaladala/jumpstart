// Cohort dashboard. v1 surface, reads from local mock data. In production
// this is the founder's daily home page with live cohort metrics and the
// digest from the Cohort Analyst agent.

import { MOCK_COHORT } from "@/lib/mock/cohort";
import { Pill } from "@/components/primitive/Pill";

export default function CohortDashboardPage() {
  const total = MOCK_COHORT.length;
  const sf = MOCK_COHORT.filter((c) => c.going_to_sf).length;
  const india = MOCK_COHORT.filter((c) => c.attended_india || c.tags.includes("india")).length;
  const remote = MOCK_COHORT.filter((c) => c.remote_global).length;
  const cofounderSeeking = MOCK_COHORT.filter((c) => c.intents.includes("cofounder")).length;

  const tagCounts = new Map<string, number>();
  for (const c of MOCK_COHORT) {
    for (const t of c.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  }
  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  const cities = new Set(MOCK_COHORT.map((c) => c.location.split(",")[0]?.trim()));

  return (
    <div className="container-wide">
      <p className="text-xxs uppercase tracking-wider text-accent font-semibold">CohortOS</p>
      <h1 className="text-3xl font-semibold tracking-tight mt-1">Cohort dashboard</h1>
      <p className="text-muted text-sm mt-2 max-w-2xl">
        Live numbers across the verified cohort. Stub mode renders from the mock fixture.
        Production uses Cohort Analyst plus a read replica of Supabase.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6 max-w-5xl">
        <Stat label="Verified total" value={total.toString()} accent />
        <Stat label="SF-bound" value={sf.toString()} />
        <Stat label="India" value={india.toString()} />
        <Stat label="Remote / global" value={remote.toString()} />
        <Stat label="Cities" value={cities.size.toString()} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 max-w-5xl">
        <div className="surface p-5 md:col-span-2">
          <p className="text-xxs uppercase tracking-wider text-muted font-semibold mb-3">
            Top tags this week
          </p>
          <div className="flex flex-wrap gap-1.5">
            {topTags.map(([t, n]) => (
              <Pill key={t} size="sm">
                {t} <span className="ml-1 text-muted">{n}</span>
              </Pill>
            ))}
          </div>
        </div>
        <div className="surface p-5">
          <p className="text-xxs uppercase tracking-wider text-muted font-semibold mb-2">
            Cofounder-intent
          </p>
          <p className="text-3xl font-semibold">{cofounderSeeking}</p>
          <p className="text-xs text-muted mt-1">verified attendees seeking a cofounder</p>
        </div>
      </div>

      <div className="surface mt-6 p-5 max-w-5xl">
        <p className="text-xxs uppercase tracking-wider text-muted font-semibold mb-3">
          Recent founders
        </p>
        <ul className="row-divide">
          {MOCK_COHORT.slice(0, 6).map((c) => (
            <li key={c.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{c.name}</p>
                <p className="text-xs text-muted">{c.location}</p>
              </div>
              <div className="flex flex-wrap gap-1 max-w-xs justify-end">
                {c.tags.slice(0, 3).map((t) => (
                  <Pill key={t} size="sm">{t}</Pill>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="surface p-4">
      <p className="text-xxs uppercase tracking-wider text-muted font-semibold">{label}</p>
      <p className={`text-2xl font-mono mt-1 ${accent ? "text-accent" : "text-ink"}`}>{value}</p>
    </div>
  );
}
