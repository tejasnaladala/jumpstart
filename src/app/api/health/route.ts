// Public health endpoint. Used by uptime monitors. Returns ONLY a generic
// readiness boolean so we do not leak which upstream dependencies are
// configured.
//
// Refuses to report ok when running stub-mode in production UNLESS
// JUMPSTART_PRIVATE_BETA=1 is set. The private-beta flag is the explicit
// opt-in that this is a tunneled or preview deploy where stub mode is
// intended (not a real production rollout).

export async function GET() {
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const stubAllowed = process.env.JUMPSTART_ALLOW_STUB === "1";
  const privateBeta = process.env.JUMPSTART_PRIVATE_BETA === "1";
  const isProd = process.env.NODE_ENV === "production";
  const stubInProd = isProd && stubAllowed && !supabaseConfigured;

  if (stubInProd && !privateBeta) {
    return Response.json(
      { ok: false, ready: false, reason: "stub_in_prod" },
      { status: 503 }
    );
  }

  return Response.json({
    ok: true,
    ready: true,
    timestamp: new Date().toISOString(),
    ...(privateBeta ? { mode: "private_beta" } : {}),
  });
}
