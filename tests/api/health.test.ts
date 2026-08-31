import { afterEach, expect, test } from "bun:test";

import { GET } from "../../src/app/api/health/route";

const PROVIDER_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "ANTHROPIC_API_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
] as const;

const originalEnv = Object.fromEntries(
  PROVIDER_ENV.map((name) => [name, process.env[name]])
) as Record<(typeof PROVIDER_ENV)[number], string | undefined>;
const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const name of PROVIDER_ENV) {
    const value = originalEnv[name];
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

test("public health is a local liveness check and never calls providers", async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.example";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-test-key";
  process.env.ANTHROPIC_API_KEY = "provider-test-key";
  process.env.UPSTASH_REDIS_REST_URL = "https://upstash.example";
  process.env.UPSTASH_REDIS_REST_TOKEN = "redis-test-token";

  let outboundCalls = 0;
  globalThis.fetch = async () => {
    outboundCalls += 1;
    throw new Error("public health must not perform outbound requests");
  };

  const response = await GET();
  const body = (await response.json()) as Record<string, unknown>;

  expect(response.status).toBe(200);
  expect(body).toEqual({ ok: true, status: "alive" });
  expect(outboundCalls).toBe(0);
});
