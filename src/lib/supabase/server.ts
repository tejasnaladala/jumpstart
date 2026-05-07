// Server-only Supabase clients. Two factories:
//
//   - getAnonServerClient()   uses the anon key + cookies. RLS applies.
//   - getServiceRoleClient()  uses the service role key. Bypasses RLS.
//                             Server-only. Throws if imported in a browser.
//
// Both throw a typed error when the relevant env vars are missing so callers
// can return a clean 503 instead of a generic 500. The service-role client
// is cached for the lifetime of the lambda; the anon client is per-request
// because cookie state matters.
//
// Stub mode does not touch this file. Routes that support stub mode check
// isStubMode() before reaching for these clients.

import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export class SupabaseConfigError extends Error {
  status = 503 as const;
  constructor(message: string) {
    super(message);
    this.name = "SupabaseConfigError";
  }
}

function readAnonEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new SupabaseConfigError(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required for the anon client."
    );
  }
  return { url, anonKey };
}

function readServiceEnv(): { url: string; serviceKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new SupabaseConfigError(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for the service-role client."
    );
  }
  return { url, serviceKey };
}

export async function getAnonServerClient(): Promise<SupabaseClient> {
  const { url, anonKey } = readAnonEnv();
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(items) {
        for (const item of items) {
          cookieStore.set(item.name, item.value, item.options);
        }
      },
    },
  });
}

let cachedServiceClient: SupabaseClient | null = null;

// Service role client. Server-only. Bypasses RLS. Use sparingly:
//   - cron jobs (no user)
//   - cross-user reads where ownership is being established (intros)
//   - server-side audit writes (agent_logs, retention_audit)
//
// If you reach for this from a route that already has a session, prefer the
// anon client unless you specifically need to bypass RLS.
export function getServiceRoleClient(): SupabaseClient {
  // Defense in depth: this code must never execute in a browser context.
  // Bundlers should already strip this out, but throw loudly if not.
  if (typeof window !== "undefined") {
    throw new Error(
      "getServiceRoleClient() must not be called from the browser."
    );
  }
  if (cachedServiceClient) return cachedServiceClient;
  const { url, serviceKey } = readServiceEnv();
  cachedServiceClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedServiceClient;
}

// Test seam. Lets the test suite reset the cached singleton between tests
// without exposing internals to product code. Not exported publicly.
export function _resetServiceClientForTests(): void {
  cachedServiceClient = null;
}
