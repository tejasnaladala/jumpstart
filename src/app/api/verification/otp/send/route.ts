// POST /api/verification/otp/send
//
// Body: { channel: "email" | "phone", target: string }
// Response: SendResult JSON (see src/lib/verification/types.ts)
//
// Status mapping:
//   200 — success (SendResult.ok = true)
//   400 — invalid body or invalid_target
//   429 — rate_limit (1/min per channel+target)
//   503 — config_incomplete (real-mode env not set; client falls back
//         to localStorage stub)
//   500 — internal or delivery_failed
//
// Runtime: Node.js. PocketBase admin auth + node:crypto + env handling
// stay predictable; the Edge runtime would force WebCrypto-only and
// break the PocketBase admin SDK's dependence on Node primitives.

import { NextResponse } from "next/server";
import { z } from "zod";
import { sendOtp } from "@/lib/verification/service";
import { getOtpServerConfig } from "@/lib/verification/config";

export const runtime = "nodejs";

const Body = z.object({
  channel: z.enum(["email", "phone"]),
  target: z.string().min(1).max(254),
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

  // Short-circuit on stub mode so the client falls back to localStorage
  // without making a useless real-mode round-trip. The 503 with
  // config_incomplete is the contract the client facade reads.
  const config = getOtpServerConfig();
  if (config.mode === "stub") {
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
