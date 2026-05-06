// Rate limiting. Upstash Redis when configured, in-memory sliding window
// fallback for dev. Per-user keys.
//
// Fixes from red-team CP1:
// - Per-key Upstash limiter cache (not a singleton)
// - In-memory mutex via per-key promise queue (no race)
// - Periodic cleanup so memBuckets does not grow forever

import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type LimiterKey =
  | "intros_hour"
  | "intros_day"
  | "drops_day"
  | "onboarding_min"
  | "browse_min";

const LIMITS: Record<LimiterKey, { limit: number; window: Duration; help: string }> = {
  intros_hour: { limit: 10, window: "1 h" as Duration, help: "10 intro requests per hour" },
  intros_day: { limit: 30, window: "1 d" as Duration, help: "30 intro requests per day" },
  drops_day: { limit: 5, window: "1 d" as Duration, help: "5 drop generations per day" },
  onboarding_min: { limit: 30, window: "1 m" as Duration, help: "30 onboarding calls per minute" },
  browse_min: { limit: 60, window: "1 m" as Duration, help: "60 browse calls per minute" },
};

const upstashByKey = new Map<LimiterKey, Ratelimit>();
const memBuckets = new Map<string, number[]>();
const memMutex = new Map<string, Promise<void>>();

function upstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

function getUpstashLimiter(key: LimiterKey): Ratelimit {
  let limiter = upstashByKey.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(LIMITS[key].limit, LIMITS[key].window),
      analytics: false,
      prefix: `js_rl:${key}`,
    });
    upstashByKey.set(key, limiter);
  }
  return limiter;
}

function parseWindowToMs(window: Duration): number {
  const m = String(window).match(/^(\d+)\s*([smhd])$/);
  if (!m) return 60_000;
  const n = parseInt(m[1]!, 10);
  const unit = m[2]!;
  if (unit === "s") return n * 1000;
  if (unit === "m") return n * 60_000;
  if (unit === "h") return n * 3_600_000;
  if (unit === "d") return n * 86_400_000;
  return 60_000;
}

async function withMutex<T>(key: string, fn: () => Promise<T> | T): Promise<T> {
  const prior = memMutex.get(key) ?? Promise.resolve();
  let release: () => void = () => {};
  const next = new Promise<void>((r) => {
    release = r;
  });
  const chain = prior.then(() => next);
  memMutex.set(key, chain);
  await prior;
  try {
    return await fn();
  } finally {
    release();
    // Drop the entry if we are still the head of the chain. Prevents the
    // map from growing one entry per unique caller forever.
    if (memMutex.get(key) === chain) {
      memMutex.delete(key);
    }
  }
}

async function memCheck(key: LimiterKey, identifier: string): Promise<boolean> {
  const conf = LIMITS[key];
  const windowMs = parseWindowToMs(conf.window);
  const bucketKey = `${key}:${identifier}`;
  return withMutex(bucketKey, () => {
    const now = Date.now();
    const fresh = (memBuckets.get(bucketKey) ?? []).filter((t) => now - t < windowMs);
    if (fresh.length >= conf.limit) {
      memBuckets.set(bucketKey, fresh);
      return false;
    }
    fresh.push(now);
    memBuckets.set(bucketKey, fresh);
    return true;
  });
}

// Periodic cleanup so memBuckets does not grow indefinitely. Only runs in
// dev mode (the prod path uses Upstash and never touches memBuckets).
if (typeof setInterval !== "undefined" && process.env.NODE_ENV !== "test" && !upstashConfigured()) {
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [k, arr] of memBuckets) {
      const keyPart = k.split(":")[0] as LimiterKey;
      const conf = LIMITS[keyPart];
      if (!conf) {
        memBuckets.delete(k);
        continue;
      }
      const windowMs = parseWindowToMs(conf.window);
      const fresh = arr.filter((t) => now - t < windowMs);
      if (fresh.length === 0) memBuckets.delete(k);
      else memBuckets.set(k, fresh);
    }
  }, 60_000);
  if (typeof (interval as { unref?: () => void }).unref === "function") {
    (interval as { unref: () => void }).unref();
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  reset_in_ms: number;
  help: string;
};

export async function checkLimit(
  key: LimiterKey,
  identifier: string
): Promise<RateLimitResult> {
  const conf = LIMITS[key];
  if (upstashConfigured()) {
    const limiter = getUpstashLimiter(key);
    const result = await limiter.limit(identifier);
    return {
      allowed: result.success,
      remaining: result.remaining,
      reset_in_ms: result.reset - Date.now(),
      help: conf.help,
    };
  }
  // Hard guard: production must use Upstash. The in-memory limiter is
  // bypassable across serverless cold starts and instances. Closes Codex
  // challenge P2 #9.
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Upstash is required in production. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN, or set NODE_ENV != 'production' for local dev."
    );
  }
  const allowed = await memCheck(key, identifier);
  const bucket = memBuckets.get(`${key}:${identifier}`) ?? [];
  return {
    allowed,
    remaining: Math.max(0, conf.limit - bucket.length),
    reset_in_ms: parseWindowToMs(conf.window),
    help: conf.help,
  };
}
