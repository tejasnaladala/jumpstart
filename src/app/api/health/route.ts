// Public liveness only. Keep this route local, cheap, and independent of
// provider configuration so uptime monitors cannot trigger paid API calls.
export async function GET() {
  return Response.json({ ok: true, status: "alive" });
}
