// POST /api/verification/otp/verify
//
// Body: { channel: "email" | "phone", target: string, code: string }
// Response: VerifyResult JSON (see src/lib/verification/types.ts)
//
// The client facade in src/lib/verification/otp.ts reads the pending
// target from localStorage and ships it to this route alongside the
// code. The route never reads or returns plaintext target via headers
// or query string. If localStorage was cleared between send and verify,
// the client returns no_pending without hitting this route.
//
// Status mapping:
//   200 — success (VerifyResult.ok = true)
//   400 — invalid body or invalid_target
//   404 — no_pending (no matching unverified row)
//   410 — expired
//   422 — mismatch (with attempts_remaining)
//   429 — rate_limit (brute-force throttle hit)
//   503 — config_incomplete (stub mode; client falls back)
//   500 — internal

import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyOtp } from "@/lib/verification/service";
import { getOtpServerConfig } from "@/lib/verification/config";

export const runtime = "nodejs";

const Body = z.object({
  channel: z.enum(["email", "phone"]),
  target: z.string().min(1).max(254),
  code: z.string().min(1).max(12),
});

export async function POST(req: Request): Promise<Response> {
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
