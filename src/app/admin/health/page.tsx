"use client";
import { useEffect, useState } from "react";

// Live admin health monitor. Polls /api/health every 4s and renders the
// per-dependency probe grid (Supabase, Anthropic, Upstash) with current
// latency. Founder-only operational surface — used for monitoring the
// closed beta of 10.
//
// Stub-mode behavior: probes return configured:false for all three
// upstream services. The endpoint still returns 200 because nothing
// configured-and-required is failing. The UI surfaces this as a
// distinct "Stub" state so the founder knows the real services aren't
// wired yet, vs a real "Failing" state where a configured service is
// returning 5xx or timing out.

type ProbeStatus = {
  ok: boolean | null;
  configured?: boolean;
  latency_ms?: number | null;
};

type HealthResponse = {
  ok: boolean;
  ready: boolean;
  timestamp: string;
  mode?: string;
  dependencies: {
    supabase: ProbeStatus;
    anthropic: ProbeStatus;
    upstash: ProbeStatus;
  };
};

const POLL_MS = 4000;

export default function AdminHealthPage() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const [history, setHistory] = useState<{ ts: number; ok: boolean }[]>([]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function poll() {
      const start = Date.now();
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        const json = (await res.json()) as HealthResponse;
        if (cancelled) return;
        setData(json);
        setError(null);
        setLastFetch(start);
        setHistory((h) => [...h.slice(-29), { ts: start, ok: json.ok }]);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Unknown error");
        setHistory((h) => [...h.slice(-29), { ts: start, ok: false }]);
      }
      if (!cancelled) {
        timer = setTimeout(poll, POLL_MS);
      }
    }

    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <div className="container-wide">
      <p className="text-xxs uppercase tracking-wider text-accent font-semibold">CohortOS</p>
      <h1 className="font-display text-4xl text-ink leading-tight mt-1">Live health</h1>
      <p className="text-muted text-sm mt-2 max-w-2xl">
        Polls <code className="text-xs bg-bg px-1.5 py-0.5 rounded">/api/health</code>{" "}
        every {POLL_MS / 1000}s. Each upstream probe has a 1.5-2.5s timeout under
        a 3s total budget. Stub means the dependency is not configured (closed beta
        runs without real services on purpose).
      </p>

      {/* Top-level status banner */}
      <div className="mt-6 max-w-5xl">
        <div
          className={`surface p-5 border ${
            !data && !error
              ? "border-border"
              : data?.ok
              ? "border-success/40 bg-success/5"
              : "border-error/40 bg-error/5"
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                !data && !error
                  ? "bg-muted/40"
                  : data?.ok
                  ? "bg-success animate-pulse"
                  : "bg-error animate-pulse"
              }`}
              aria-hidden
            />
            <p className="text-base font-semibold text-ink">
              {!data && !error
                ? "Checking..."
                : error
                ? "Probe failed"
                : data?.ok
                ? "All systems operational"
                : "One or more dependencies unhealthy"}
            </p>
            {data?.mode === "private_beta" ? (
              <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
                Private beta
              </span>
            ) : null}
          </div>
          {data ? (
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted mt-2">
              Last poll {new Date(lastFetch).toLocaleTimeString()} · ts {data.timestamp}
            </p>
          ) : null}
          {error ? (
            <p className="text-xs text-error mt-2 font-mono">{error}</p>
          ) : null}
        </div>
      </div>

      {/* Per-dependency probe grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 max-w-5xl">
        {(["supabase", "anthropic", "upstash"] as const).map((name) => {
          const probe = data?.dependencies?.[name];
          const state = !probe
            ? "loading"
            : probe.configured === false
            ? "stub"
            : probe.ok
            ? "healthy"
            : "failing";
          const colorClass =
            state === "healthy"
              ? "border-success/40"
              : state === "failing"
              ? "border-error/40 bg-error/5"
              : state === "stub"
              ? "border-border"
              : "border-border";
          const dotClass =
            state === "healthy"
              ? "bg-success"
              : state === "failing"
              ? "bg-error"
              : state === "stub"
              ? "bg-muted/40"
              : "bg-muted/40 animate-pulse";
          return (
            <div key={name} className={`surface p-4 border ${colorClass}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-ink capitalize">{name}</p>
                <span className={`h-2 w-2 rounded-full ${dotClass}`} aria-hidden />
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                {state === "loading"
                  ? "Probing…"
                  : state === "stub"
                  ? "Not configured"
                  : state === "healthy"
                  ? `${probe?.latency_ms ?? "?"} ms`
                  : `Failing${probe?.latency_ms ? ` · ${probe.latency_ms} ms` : ""}`}
              </p>
            </div>
          );
        })}
      </div>

      {/* Tiny history sparkline */}
      <div className="surface mt-6 p-5 max-w-5xl">
        <p className="text-xxs uppercase tracking-wider text-muted font-semibold mb-3">
          Last {history.length} polls
        </p>
        <div className="flex items-end gap-1 h-12">
          {history.map((h, i) => (
            <div
              key={`${h.ts}-${i}`}
              className={`w-2 rounded-t ${h.ok ? "bg-success/70" : "bg-error/70"}`}
              style={{ height: h.ok ? "100%" : "30%" }}
              title={`${new Date(h.ts).toLocaleTimeString()} — ${h.ok ? "ok" : "fail"}`}
            />
          ))}
          {history.length === 0 ? (
            <p className="text-xs text-muted">Awaiting first poll…</p>
          ) : null}
        </div>
      </div>

      {/* Operational meta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6 max-w-5xl">
        <div className="surface p-5">
          <p className="text-xxs uppercase tracking-wider text-muted font-semibold mb-2">
            What this monitor does
          </p>
          <ul className="text-xs text-muted leading-relaxed space-y-1.5">
            <li>· HEAD on Supabase REST (1.5s timeout)</li>
            <li>· 1-token Claude Haiku ping (2.5s timeout)</li>
            <li>· Redis PING via Upstash REST (1.5s timeout)</li>
            <li>· Total budget 3s via AbortController</li>
            <li>· 503 if any configured-and-required dep is failing</li>
          </ul>
        </div>
        <div className="surface p-5">
          <p className="text-xxs uppercase tracking-wider text-muted font-semibold mb-2">
            What it does NOT do
          </p>
          <ul className="text-xs text-muted leading-relaxed space-y-1.5">
            <li>· Tail server logs (use Vercel dashboard)</li>
            <li>· Track per-user activity (use /admin/cohort)</li>
            <li>· Alert on incidents (wire Sentry / Slack)</li>
            <li>· Show env vars (intentional — no leak surface)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
