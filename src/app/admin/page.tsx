import Link from "next/link";

const TILES = [
  {
    href: "/admin/health",
    title: "Live health",
    body: "Polls /api/health every 4s. Per-dependency probes (Supabase, Anthropic, Upstash) with latency, plus a 30-poll history sparkline.",
  },
  {
    href: "/admin/moderation",
    title: "Moderation queue",
    body: "Reports, flagged intros, verifications waiting on review.",
  },
  {
    href: "/admin/logs",
    title: "Agent logs",
    body: "Per-agent invocations, tokens, latency, cost. Filter by user.",
  },
  {
    href: "/admin/cohort",
    title: "Cohort dashboard",
    body: "Verified count, geography, drop performance, anomalies.",
  },
];

export default function AdminHome() {
  return (
    <div className="container-wide">
      <p className="text-xxs uppercase tracking-wider text-accent font-semibold">
        CohortOS
      </p>
      <h1 className="font-display text-4xl text-ink leading-tight mt-1">Admin home</h1>
      <p className="text-muted text-sm mt-2 max-w-2xl">
        Founder-only operational surface. Read-mostly. The agents do the work,
        you review the output.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 max-w-6xl">
        {TILES.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="surface p-5 hover:border-ink/40 hover:shadow-card transition-all"
          >
            <h3 className="text-base font-semibold">{t.title}</h3>
            <p className="text-sm text-muted mt-1.5 leading-relaxed">{t.body}</p>
            <span className="text-xs text-accent mt-3 inline-block">Open →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
