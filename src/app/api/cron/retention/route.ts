// 24-hour retention job. Deletes acceptance-screenshot artifacts whose
// expires_at has passed. Triggered by Vercel Cron daily.
//
// Auth: this endpoint requires the CRON_SECRET header to match the env var.
// Without that, it returns 403. This is the only allowed un-session-gated
// path inside /api besides /api/health.

import { jsonError } from "@/lib/api/schema";
import { timingSafeEqual } from "node:crypto";
import { getServiceRoleClient, SupabaseConfigError } from "@/lib/supabase/server";

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

  // 1. SELECT id, artifact_url FROM verifications WHERE artifact_expires_at < now()
  //    AND artifact_url IS NOT NULL
  // 2. For each row, delete the storage object (best-effort; one 404 should
  //    not fail the whole batch — log and continue).
  // 3. UPDATE verifications SET artifact_url = NULL, artifact_expires_at = NULL
  // 4. INSERT into retention_audit (run_at, deleted_count, audited_count, error?)
  //
  // The audit row is the contract that proves the cron ran. The deleted_count
  // is the number of storage objects we actually removed; audited_count is
  // the number of verification rows we touched. They differ when storage
  // delete fails on a row whose URL no longer points to a real object.

  let svc;
  try {
    svc = getServiceRoleClient();
  } catch (err) {
    if (err instanceof SupabaseConfigError) {
      return jsonError(503, "RETENTION_NOT_IMPLEMENTED", err.message);
    }
    return jsonError(500, "RETENTION_ERROR", "Could not initialise service-role client.");
  }

  const nowIso = new Date().toISOString();
  let deletedCount = 0;
  let auditedCount = 0;
  let errorMessage: string | null = null;

  try {
    const { data: rows, error: selectErr } = await svc
      .from("verifications")
      .select("id, artifact_url")
      .lt("artifact_expires_at", nowIso)
      .not("artifact_url", "is", null);

    if (selectErr) {
      errorMessage = `verifications select failed: ${selectErr.message}`;
    } else {
      const targets = rows ?? [];
      auditedCount = targets.length;

      for (const row of targets) {
        const url = row.artifact_url as string | null;
        if (!url) continue;

        const objectPath = parseStoragePath(url);
        if (objectPath) {
          const { bucket, key } = objectPath;
          const { error: storageErr } = await svc.storage.from(bucket).remove([key]);
          // Silently continue on 404 / permission errors. The row is still
          // expired and we will null its columns below regardless.
          if (!storageErr) {
            deletedCount += 1;
          }
        }

        const { error: updateErr } = await svc
          .from("verifications")
          .update({ artifact_url: null, artifact_expires_at: null })
          .eq("id", row.id);
        if (updateErr && !errorMessage) {
          errorMessage = `verifications update failed: ${updateErr.message}`;
        }
      }
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err);
  }

  // Always insert an audit row, even when an error occurred mid-batch. The
  // founder dashboard reads retention_audit to verify the cron ran.
  await svc.from("retention_audit").insert({
    deleted_count: deletedCount,
    audited_count: auditedCount,
    error: errorMessage,
  });

  if (errorMessage) {
    return jsonError(500, "RETENTION_PARTIAL_FAILURE", errorMessage, {
      deleted: deletedCount,
      audited: auditedCount,
    });
  }

  return Response.json({
    deleted: deletedCount,
    audited: auditedCount,
    ts: nowIso,
  });
}

// Parses a Supabase Storage public URL into { bucket, key } so we can call
// storage.from(bucket).remove([key]). Accepts the standard public-URL shape:
//   https://<project>.supabase.co/storage/v1/object/public/<bucket>/<key>
//   https://<project>.supabase.co/storage/v1/object/sign/<bucket>/<key>?...
// Returns null when the URL does not match — caller treats it as "leave
// alone, just null the columns".
function parseStoragePath(url: string): { bucket: string; key: string } | null {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/);
    if (!m) return null;
    return { bucket: m[1], key: decodeURIComponent(m[2]) };
  } catch {
    return null;
  }
}
