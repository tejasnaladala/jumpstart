// Tests for the Supabase server-only client factories. Exercises the
// SupabaseConfigError path and the cached singleton behavior of the
// service-role client. No live Supabase needed.

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import {
  getServiceRoleClient,
  SupabaseConfigError,
  _resetServiceClientForTests,
} from "@/lib/supabase/server";

describe("getServiceRoleClient", () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  beforeEach(() => {
    _resetServiceClientForTests();
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  afterEach(() => {
    _resetServiceClientForTests();
    if (originalUrl !== undefined) process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    else delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (originalKey !== undefined) process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
    else delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  test("throws SupabaseConfigError when URL is missing", () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
    expect(() => getServiceRoleClient()).toThrow(SupabaseConfigError);
  });

  test("throws SupabaseConfigError when service role key is missing", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    expect(() => getServiceRoleClient()).toThrow(SupabaseConfigError);
  });

  test("returns a client when both env vars are set", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
    const client = getServiceRoleClient();
    expect(client).toBeDefined();
    expect(typeof client.from).toBe("function");
  });

  test("caches the client across calls (singleton per process)", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
    const a = getServiceRoleClient();
    const b = getServiceRoleClient();
    expect(a).toBe(b);
  });

  test("SupabaseConfigError carries 503 status", () => {
    try {
      getServiceRoleClient();
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(SupabaseConfigError);
      expect((err as SupabaseConfigError).status).toBe(503);
    }
  });
});
