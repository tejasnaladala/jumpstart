// 24-hour retention job. Deletes acceptance-screenshot artifacts whose
// expires_at has passed. Triggered by Vercel Cron daily.
//
// Auth: this endpoint requires the CRON_SECRET header to match the env var.
// Without that, it returns 403. This is the only allowed un-session-gated
// path inside /api besides /api/health.

import { jsonError } from "@/lib/api/schema";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : "";

  if (!expected) {
    return jsonError(503, "CRON_NOT_CONFIGURED", "CRON_SECRET is not set.");
  }
  if (auth !== expected) {
    return jsonError(403, "FORBIDDEN", "Cron auth required.");
  }

  // TODO(prod): with Supabase wired up, this should:
  //   1. SELECT id, artifact_url FROM verifications WHERE artifact_expires_at < now() AND artifact_url IS NOT NULL
  //   2. For each row, delete the storage object
  //   3. UPDATE verifications SET artifact_url = NULL, artifact_expires_at = NULL WHERE id = $1
  //   4. INSERT a row into a retention_audit table

  return Response.json({
    ok: true,
    deleted: 0,
    note: "stub run, no Supabase wired",
    ran_at: new Date().toISOString(),
  });
}
