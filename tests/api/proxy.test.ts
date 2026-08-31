import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";
import { proxy } from "../../src/proxy";

const originalEnv = {
  allowStub: process.env.JUMPSTART_ALLOW_STUB,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

beforeEach(() => {
  delete process.env.JUMPSTART_ALLOW_STUB;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
});

afterAll(() => {
  restoreEnv("JUMPSTART_ALLOW_STUB", originalEnv.allowStub);
  restoreEnv("NEXT_PUBLIC_SUPABASE_URL", originalEnv.supabaseUrl);
  restoreEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", originalEnv.supabaseAnonKey);
});

describe("API proxy fast-fail boundary", () => {
  test("allows public liveness without configuration", () => {
    const response = proxy(request("/api/health"));
    expect(response.status).toBe(200);
  });

  test("does not treat public-route prefix collisions as public", async () => {
    const healthCollision = proxy(request("/api/healthcheck"));
    const cronCollision = proxy(request("/api/cronicle"));

    expect(healthCollision.status).toBe(500);
    expect(cronCollision.status).toBe(500);
    expect(await healthCollision.json()).toEqual({
      error: "Supabase environment is required.",
      code: "SUPABASE_NOT_CONFIGURED",
    });
    expect(await cronCollision.json()).toEqual({
      error: "Supabase environment is required.",
      code: "SUPABASE_NOT_CONFIGURED",
    });
  });

  test("fails closed when Supabase and stub mode are both absent", async () => {
    const response = proxy(request("/api/intros"));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Supabase environment is required.",
      code: "SUPABASE_NOT_CONFIGURED",
    });
  });

  test("allows the explicit stub path", () => {
    process.env.JUMPSTART_ALLOW_STUB = "1";
    const response = proxy(request("/api/intros"));
    expect(response.status).toBe(200);
  });

  test("rejects a configured request without an auth cookie", async () => {
    configureSupabase();
    const response = proxy(request("/api/intros"));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Authentication required.",
      code: "UNAUTHORIZED",
    });
  });

  test("accepts a chunked Supabase auth cookie as a fast-fail hint", () => {
    configureSupabase();
    const response = proxy(
      request("/api/intros", { cookie: "sb-project-auth-token.0=opaque" })
    );
    expect(response.status).toBe(200);
  });
});

function request(path: string, headers?: HeadersInit): NextRequest {
  return new NextRequest(`http://localhost:3030${path}`, { headers });
}

function configureSupabase(): void {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
