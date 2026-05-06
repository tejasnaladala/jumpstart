// Server-side session reader. Returns the authenticated user from Supabase
// when keys are present. In dev/stub mode (and only when explicitly allowed),
// returns a deterministic test session so the local UX is fully functional
// without provisioning anything.
//
// Hard guard: stub mode is forbidden in production unless JUMPSTART_ALLOW_STUB
// is explicitly set. NODE_ENV alone is not enough because Vercel preview
// deploys also run with NODE_ENV=production.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";
import { DEFAULT_ME } from "@/lib/mock/me";

export type SessionUser = {
  id: string;
  email: string;
  trust_tier: "provisional" | "verified" | "peer_vouched";
};

const TrustTierSchema = z.enum(["provisional", "verified", "peer_vouched"]);

const DEV_USER: SessionUser = {
  id: DEFAULT_ME.user_id,
  email: "tejas@local.dev",
  trust_tier: "verified",
};

function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function stubAllowed(): boolean {
  return process.env.JUMPSTART_ALLOW_STUB === "1";
}

export async function getSession(): Promise<SessionUser | null> {
  if (!supabaseConfigured()) {
    if (!stubAllowed()) {
      throw new Error(
        "Supabase environment is required. Set NEXT_PUBLIC_SUPABASE_URL/ANON_KEY, or set JUMPSTART_ALLOW_STUB=1 for explicit local dev."
      );
    }
    return DEV_USER;
  }

  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

  const supabase = createServerClient(url, anonKey, {
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

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;

  const { data: row } = await supabase
    .from("users")
    .select("trust_tier")
    .eq("id", data.user.id)
    .single();

  const tier = TrustTierSchema.safeParse(row?.trust_tier);

  return {
    id: data.user.id,
    email: data.user.email ?? "",
    trust_tier: tier.success ? tier.data : "provisional",
  };
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new UnauthorizedError("Authentication required");
  }
  return session;
}

export class UnauthorizedError extends Error {
  status = 401 as const;
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export function isStubMode(): boolean {
  return !supabaseConfigured() && stubAllowed();
}
