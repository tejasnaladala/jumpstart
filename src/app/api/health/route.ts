// Public health endpoint. Used by uptime monitors and the /admin readiness
// dashboard. Performs real liveness probes against upstream dependencies
// (Supabase, Anthropic, Upstash) when configured, with a hard 3s budget
// total so a slow probe cannot cascade into a slow health response.
//
// Returns 200 only if all configured-and-required dependencies report
// healthy. Returns 503 if any required upstream is failing or if running
// stub-mode in production WITHOUT the JUMPSTART_PRIVATE_BETA opt-in.
//
// Probe semantics:
//   - Supabase: HEAD /rest/v1/users?limit=1, 1.5s timeout
//   - Anthropic: small messages.create with max_tokens=1, 2.5s timeout
//   - Upstash: REDIS PING via REST, 1.5s timeout
//   - All three run concurrently with Promise.allSettled, total budget
//     enforced via a single AbortController per probe
//
// Closes DevOps audit blocker #3 (health was performative, only checking
// env vars).

const PROBE_BUDGET_MS = 3000;

type ProbeResult = {
  name: "supabase" | "anthropic" | "upstash";
  configured: boolean;
  ok: boolean;
  latency_ms?: number;
  error?: string;
};

async function withTimeout<T>(p: Promise<T>, ms: number, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new Error("aborted"));
    });
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

async function probeSupabase(signal: AbortSignal): Promise<ProbeResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return { name: "supabase", configured: false, ok: false };
  }
  const start = Date.now();
  try {
    await withTimeout(
      fetch(`${url}/rest/v1/users?limit=1`, {
        method: "HEAD",
        headers: { apikey: key, authorization: `Bearer ${key}` },
        signal,
      }).then((r) => {
        // 401 / 403 is fine: it means Supabase is up and replied.
        // 5xx means Supabase is sick.
        if (r.status >= 500) throw new Error(`status ${r.status}`);
      }),
      1500,
      signal
    );
    return { name: "supabase", configured: true, ok: true, latency_ms: Date.now() - start };
  } catch (err) {
    return {
      name: "supabase",
      configured: true,
      ok: false,
      latency_ms: Date.now() - start,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}

async function probeAnthropic(signal: AbortSignal): Promise<ProbeResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return { name: "anthropic", configured: false, ok: false };
  }
  // Skip the expensive probe when the kill switch is on or stubs are forced.
  // The endpoint can still be healthy even if Anthropic is intentionally off.
  if (
    process.env.JUMPSTART_DISABLE_ANTHROPIC === "1" ||
    process.env.JUMPSTART_FORCE_STUBS === "1"
  ) {
    return { name: "anthropic", configured: true, ok: true, latency_ms: 0 };
  }
  const start = Date.now();
  try {
    await withTimeout(
      fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5",
          max_tokens: 1,
          messages: [{ role: "user", content: "." }],
        }),
        signal,
      }).then((r) => {
        if (r.status >= 500) throw new Error(`status ${r.status}`);
        if (r.status === 401 || r.status === 403) throw new Error("auth failed");
      }),
      2500,
      signal
    );
    return { name: "anthropic", configured: true, ok: true, latency_ms: Date.now() - start };
  } catch (err) {
    return {
      name: "anthropic",
      configured: true,
      ok: false,
      latency_ms: Date.now() - start,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}

async function probeUpstash(signal: AbortSignal): Promise<ProbeResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return { name: "upstash", configured: false, ok: false };
  }
  const start = Date.now();
  try {
    await withTimeout(
      fetch(`${url}/ping`, {
        headers: { authorization: `Bearer ${token}` },
        signal,
      }).then((r) => {
        if (r.status >= 500) throw new Error(`status ${r.status}`);
      }),
      1500,
      signal
    );
    return { name: "upstash", configured: true, ok: true, latency_ms: Date.now() - start };
  } catch (err) {
    return {
      name: "upstash",
      configured: true,
      ok: false,
      latency_ms: Date.now() - start,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}

export async function GET() {
  const isProd = process.env.NODE_ENV === "production";
  const stubAllowed = process.env.JUMPSTART_ALLOW_STUB === "1";
  const privateBeta = process.env.JUMPSTART_PRIVATE_BETA === "1";
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const stubInProd = isProd && stubAllowed && !supabaseConfigured;

  if (stubInProd && !privateBeta) {
    return Response.json(
      { ok: false, ready: false, reason: "stub_in_prod" },
      { status: 503 }
    );
  }

  // Real probes: 3-second hard budget across all three.
  const ac = new AbortController();
  const budgetTimer = setTimeout(() => ac.abort(), PROBE_BUDGET_MS);

  const probes: ProbeResult[] = await Promise.all([
    probeSupabase(ac.signal),
    probeAnthropic(ac.signal),
    probeUpstash(ac.signal),
  ]);

  clearTimeout(budgetTimer);

  const configuredAndFailing = probes.filter((p) => p.configured && !p.ok);
  const overallOk = configuredAndFailing.length === 0;

  // Public response: only signals readiness + a per-dependency status grid.
  // No env values, no specific error messages that could leak misconfig.
  const status = Object.fromEntries(
    probes.map((p) => [
      p.name,
      p.configured
        ? { ok: p.ok, latency_ms: p.latency_ms ?? null }
        : { ok: null, configured: false },
    ])
  );

  return Response.json(
    {
      ok: overallOk,
      ready: overallOk,
      timestamp: new Date().toISOString(),
      ...(privateBeta ? { mode: "private_beta" } : {}),
      dependencies: status,
    },
    { status: overallOk ? 200 : 503 }
  );
}
