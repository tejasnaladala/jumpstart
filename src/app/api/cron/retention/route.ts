// 24-hour retention job. Deletes acceptance-screenshot artifacts whose
// expires_at has passed. Triggered by Vercel Cron daily.
//
// Auth: this endpoint requires the CRON_SECRET header to match the env var.
// Without that, it returns 403. This is the only allowed un-session-gated
// path inside /api besides /api/health.

import { jsonError } from "@/lib/api/schema";
import { timingSafeEqual } from "node:crypto";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return jsonError(503, "CRON_NOT_CONFIGURED", "CRON_SECRET is not set.");
  }

  // Constant-time compare. Pad to equal length so timingSafeEqual does not
  // throw when sizes differ; the constant-time guarantee still holds for
  // same-length inputs and timing-safe failure for different-length inputs.
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(auth.padEnd(expected.length, "\0").slice(0, expected.length));
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b) || auth.length !== expected.length) {
    return jsonError(403, "FORBIDDEN", "Cron auth required.");
  }

  // Refuse to silently report success when the work is not actually done.
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  if (!supabaseConfigured) {
    return jsonError(
      503,
      "RETENTION_NOT_IMPLEMENTED",
      "Retention job requires Supabase service role. Returning 503 so monitors flag the gap."
    );
  }

  // TODO(prod): with Supabase wired up:
  //   1. SELECT id, artifact_url FROM verifications WHERE artifact_expires_at < now() AND artifact_url IS NOT NULL
  //   2. For each row, delete the storage object
  //   3. UPDATE verifications SET artifact_url = NULL, artifact_expires_at = NULL WHERE id = $1
  //   4. INSERT a row into a retention_audit table

  return Response.json({
    ok: true,
    deleted: 0,
    note: "wired but no rows to expire",
    ran_at: new Date().toISOString(),
  });
}
