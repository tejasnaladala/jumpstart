// Public health endpoint. Used by uptime monitors. Returns version, mode,
// and a single boolean per dependency (without leaking config details).

export async function GET() {
  const supabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const anthropic = Boolean(process.env.ANTHROPIC_API_KEY);
  const upstash = Boolean(process.env.UPSTASH_REDIS_REST_URL);
  const stub = process.env.JUMPSTART_ALLOW_STUB === "1";

  return Response.json({
    ok: true,
    mode: stub && !supabase ? "stub" : "live",
    deps: { supabase, anthropic, upstash },
    timestamp: new Date().toISOString(),
  });
}
