"use client";

import { useEffect, useState } from "react";

type HealthResponse = {
  ok: boolean;
  status: "alive";
};

const POLL_MS = 10_000;

export default function AdminHealthPage() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number | null>(null);
  const [history, setHistory] = useState<{ ts: number; ok: boolean }[]>([]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function poll() {
      const checkedAt = Date.now();
      let ok = false;

      try {
        const response = await fetch("/api/health", { cache: "no-store" });
        const body = (await response.json()) as HealthResponse;
        ok = response.ok && body.ok && body.status === "alive";
        if (!ok) throw new Error("Liveness check returned an unhealthy response");

        if (!cancelled) {
          setData(body);
          setError(null);
        }
      } catch (caught) {
        if (!cancelled) {
          setData(null);
          setError(caught instanceof Error ? caught.message : "Liveness check failed");
        }
      }

      if (!cancelled) {
        setLastFetch(checkedAt);
        setHistory((items) => [...items.slice(-29), { ts: checkedAt, ok }]);
        timer = setTimeout(poll, POLL_MS);
      }
    }

    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const healthy = data?.ok === true && !error;

  return (
    <div className="container-wide">
      <p className="text-xxs uppercase tracking-wider text-accent font-semibold">CohortOS</p>
      <h1 className="font-display text-4xl text-ink leading-tight mt-1">Live health</h1>

      <div className="mt-6 max-w-3xl">
        <div
          className={`surface p-5 border ${
            healthy
              ? "border-success/40 bg-success/5"
              : error
                ? "border-error/40 bg-error/5"
                : "border-border"
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                healthy ? "bg-success" : error ? "bg-error" : "bg-muted/40 animate-pulse"
              }`}
              aria-hidden
            />
            <p className="text-base font-semibold text-ink">
              {healthy
                ? "Application process is responding"
                : error
                  ? "Liveness check failed"
                  : "Checking application process"}
            </p>
          </div>

          {lastFetch ? (
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted mt-2">
              Last check {new Date(lastFetch).toLocaleTimeString()}
            </p>
          ) : null}
          {error ? <p className="text-xs text-error mt-2 font-mono">{error}</p> : null}
        </div>

        <div className="surface mt-4 p-5">
          <p className="text-xxs uppercase tracking-wider text-muted font-semibold mb-3">
            Recent checks
          </p>
          <div className="flex items-end gap-1 h-12" aria-label="Recent liveness checks">
            {history.map((item) => (
              <div
                key={item.ts}
                className={`w-2 rounded-t ${item.ok ? "bg-success/70" : "bg-error/70"}`}
                style={{ height: item.ok ? "100%" : "30%" }}
                title={`${new Date(item.ts).toLocaleTimeString()} - ${item.ok ? "ok" : "failed"}`}
              />
            ))}
            {history.length === 0 ? (
              <p className="text-xs text-muted">Awaiting first check</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
