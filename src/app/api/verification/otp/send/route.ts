// POST /api/verification/otp/send
//
// Body: { channel: "email" | "phone", target: string }
// Response: SendResult JSON (see src/lib/verification/types.ts)
//
// Status mapping:
//   200 — success (SendResult.ok = true)
//   400 — invalid body or invalid_target
//   429 — rate_limit (per-target 1/min OR per-IP 5/min)
//   503 — config_incomplete (real-mode env not set; client falls back
//         to localStorage stub — DEV / PRIVATE_BETA only)
//   500 — internal, delivery_failed, OR misconfigured prod
//
// Runtime: Node.js. PocketBase admin auth + node:crypto + env handling
// stay predictable; the Edge runtime would force WebCrypto-only and
// break the PocketBase admin SDK's dependence on Node primitives.
//
// Hardening (May 7, codex H1+H2+H4 + backend-patterns #4):
//   - Added IP-keyed rate limit (otp_send_ip_min, 5/min/IP) on top of
//     the per-target bucket. Stops a single source from rotating
//     distinct targets to spam Twilio/Resend.
//   - Hard-block stub fallback in NODE_ENV=production unless
//     JUMPSTART_PRIVATE_BETA=1. Returns 500 instead of 503 so the
//     client facade does NOT fall back to localStorage. Closes
//     the "anyone can self-verify by blocking the API" exploit.

import { NextResponse } from "next/server";
import { z } from "zod";
import { sendOtp } from "@/lib/verification/service";
import { getOtpServerConfig } from "@/lib/verification/config";
import { checkLimit } from "@/lib/auth/rate-limit";

export const runtime = "nodejs";

const Body = z.object({
  channel: z.enum(["email", "phone"]),
  target: z.string().min(1).max(254),
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
  // IP rate limit FIRST so an unparseable body still costs the attacker
  // a bucket slot. 5/min/IP. Layered on top of per-target 1/min.
  const ip = clientIp(req);
  const ipLimit = await checkLimit("otp_send_ip_min", ip);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        reason: "rate_limit",
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

  // Stub-mode handling. In DEV or explicit PRIVATE_BETA: return 503
  // config_incomplete so the client facade falls back to localStorage
  // (closed-beta-of-2 path). In real prod without PRIVATE_BETA: hard
  // 500 — the client must NOT silently downgrade to a self-issued code.
  const config = getOtpServerConfig();
  if (config.mode === "stub") {
    if (isRealProd()) {
      console.error(
        "[otp/send] stub mode in NODE_ENV=production without JUMPSTART_PRIVATE_BETA=1; refusing fallback. Missing env:",
        config.reason === "missing_env" ? config.missing.join(",") : config.reason
      );
      return NextResponse.json(
        { ok: false, reason: "internal" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { ok: false, reason: "config_incomplete" },
      { status: 503 }
    );
  }

  const result = await sendOtp(parsed.data, { config });
  if (result.ok) {
    return NextResponse.json(result, { status: 200 });
  }
  switch (result.reason) {
    case "invalid_target":
      return NextResponse.json(result, { status: 400 });
    case "rate_limit":
      return NextResponse.json(result, { status: 429 });
    case "config_incomplete":
      return NextResponse.json(result, { status: 503 });
    case "delivery_failed":
    case "internal":
    default:
      return NextResponse.json(result, { status: 500 });
  }
}
