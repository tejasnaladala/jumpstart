// POST /api/verification/otp/verify
//
// Body: { channel: "email" | "phone", target: string, code: string }
// Response: VerifyResult JSON (see src/lib/verification/types.ts)
//
// Status mapping:
//   200 — success (VerifyResult.ok = true)
//   400 — invalid body or invalid_target
//   404 — no_pending (no matching unverified row)
//   410 — expired
//   422 — mismatch (with attempts_remaining)
//   429 — rate_limit (per-row 5-strike OR per-IP 10/min)
//   503 — config_incomplete (DEV / PRIVATE_BETA only; prod hard-500s)
//   500 — internal OR misconfigured prod
//
// Hardening (May 7, codex H5 + backend-patterns #4):
//   - Per-IP rate limit (otp_verify_ip_min, 10/min/IP) on top of the
//     per-row 5-strike attempts throttle. Closes the unauthenticated
//     enumeration oracle (404 vs 422 status leaked which targets had
//     pending OTPs).
//   - Same prod-stub hard-block as /send: in real prod the client must
//     not silently fall back to localStorage verify.

import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyOtp } from "@/lib/verification/service";
import { getOtpServerConfig } from "@/lib/verification/config";
import { checkLimit } from "@/lib/auth/rate-limit";

export const runtime = "nodejs";

const Body = z.object({
  channel: z.enum(["email", "phone"]),
  target: z.string().min(1).max(254),
  code: z.string().min(1).max(12),
});

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function isRealProd(): boolean {
  return (
    process.env.NODE_ENV === "production" &&
    process.env.JUMPSTART_PRIVATE_BETA !== "1"
  );
}

export async function POST(req: Request): Promise<Response> {
  const ip = clientIp(req);
  const ipLimit = await checkLimit("otp_verify_ip_min", ip);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        reason: "rate_limit" as const,
        retry_after_ms: ipLimit.reset_in_ms,
      },
      { status: 429 }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, reason: "invalid_target" },
      { status: 400 }
    );
  }

  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, reason: "invalid_target" },
      { status: 400 }
    );
  }

  const config = getOtpServerConfig();
  if (config.mode === "stub") {
    if (isRealProd()) {
      console.error(
        "[otp/verify] stub mode in NODE_ENV=production without JUMPSTART_PRIVATE_BETA=1; refusing fallback."
      );
      return NextResponse.json(
        { ok: false, reason: "internal" as const },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { ok: false, reason: "config_incomplete" as const },
      { status: 503 }
    );
  }

  const result = await verifyOtp(parsed.data, { config });
  if (result.ok) {
    return NextResponse.json(result, { status: 200 });
  }
  switch (result.reason) {
    case "invalid_target":
      return NextResponse.json(result, { status: 400 });
    case "no_pending":
      return NextResponse.json(result, { status: 404 });
    case "expired":
      return NextResponse.json(result, { status: 410 });
    case "mismatch":
      return NextResponse.json(result, { status: 422 });
    case "rate_limit":
      return NextResponse.json(result, { status: 429 });
    case "internal":
    default:
      return NextResponse.json(result, { status: 500 });
  }
}
