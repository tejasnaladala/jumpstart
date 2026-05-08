// Server-side PocketBase admin client. Authenticates with the admin
// credentials from getOtpServerConfig() once, caches the authenticated
// client at module scope, and re-authenticates on auth failure.
//
// Why module-scope cache: Vercel route handlers cold-start once per
// container; reusing the auth token across requests keeps OTP sends
// fast (no PB admin login on every send). Token re-auth is best-effort
// on 401 — if it still fails, the route handler returns 503.
//
// Never import this file from a client component. The PocketBase admin
// SDK includes the admin password in the auth flow; bundling it for the
// browser would be catastrophic.

import PocketBase from "pocketbase";

// Inline config shape — used to live in @/lib/verification/config but
// the verification flow has been removed (waitlist-only pre-product).
// Keeping this admin client around for future PocketBase usage.
type OtpRealConfig = {
  pocketbaseUrl: string;
  pocketbaseAdminEmail: string;
  pocketbaseAdminPassword: string;
};

let cachedClient: PocketBase | null = null;
let cachedClientUrl: string | null = null;

// Returns a PocketBase admin client authenticated with the server's
// admin credentials. Subsequent calls reuse the same client and token
// unless the URL changed (which can happen during tests or env hot
// reload). Re-authenticates if the cached token isn't valid.
export async function getPocketBaseAdminClient(
  config: OtpRealConfig
): Promise<PocketBase> {
  if (
    cachedClient &&
    cachedClientUrl === config.pocketbaseUrl &&
    cachedClient.authStore.isValid
  ) {
    return cachedClient;
  }

  const client = new PocketBase(config.pocketbaseUrl);
  // PocketBase 0.22+ uses /_superusers; older versions used /_admins.
  // The SDK exposes both via collection auth flows.
  try {
    await client
      .collection("_superusers")
      .authWithPassword(
        config.pocketbaseAdminEmail,
        config.pocketbaseAdminPassword
      );
  } catch (e) {
    // Fallback for older PocketBase deployments where the admin
    // collection is named _admins.
    try {
      await client
        .collection("_admins")
        .authWithPassword(
          config.pocketbaseAdminEmail,
          config.pocketbaseAdminPassword
        );
    } catch {
      throw e;
    }
  }

  cachedClient = client;
  cachedClientUrl = config.pocketbaseUrl;
  return client;
}

// Test-only: reset the module-scope cache so unit tests don't share
// auth state across runs. Not exported from a barrel; tests import
// directly.
export function resetPocketBaseAdminClientForTests(): void {
  cachedClient = null;
  cachedClientUrl = null;
}
