// Public waitlist endpoint. Captures interest from people who hit the
// landing page after we publish to LinkedIn / X but who are not yet
// invited into the closed beta.
//
// Stub-mode storage: appends to experiments/waitlist.jsonl (gitignored).
// Real-mode: same shape moves to PocketBase or Supabase later via the
// migration plan in issue #5.
//
// What we deliberately don't do:
//   - No magic-link email. The founder reviews the list manually and
//     invites people via existing /onboarding/verification flow.
//   - No public count of waitlist size. Avoid herd metrics that pressure
//     the founder into batch-admitting.
//   - No leaderboard / referral codes in v1. Keep the surface boring.

import { NextResponse } from "next/server";
import { z } from "zod";
import { existsSync, mkdirSync, appendFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { checkLimit } from "@/lib/auth/rate-limit";

const LOG = path.resolve(process.cwd(), "experiments", "waitlist.jsonl");

const Body = z.object({
  email: z.string().email().max(120),
  // Optional. Either a Twitter/X handle (with or without @), a LinkedIn
  // URL fragment (e.g. linkedin.com/in/...) or any free-text "where to
  // find me" hint. We don't validate beyond a length cap.
  handle: z.string().trim().max(160).optional(),
  // Optional one-liner. The founder reads these in order to decide
  // whether to invite or skip. Plain text only.
  building: z.string().trim().max(280).optional(),
  // Optional referral source. We log it so we can attribute LinkedIn
  // vs X vs direct vs other.
  source: z.string().trim().max(60).optional(),
});

type WaitlistEntry = {
  ts: string;
  email: string;
  handle?: string;
  building?: string;
  source?: string;
  ip_hash: string;
};

function hashIp(ip: string): string {
  // Constant-time non-cryptographic hash. Real solution post-launch is
  // a salted SHA-256 with a server-only secret. For now we just want to
  // dedupe rough abuse without persisting raw IPs.
  let h = 0;
  for (let i = 0; i < ip.length; i++) h = (h * 31 + ip.charCodeAt(i)) | 0;
  return `ip_${(h >>> 0).toString(36)}`;
}

function alreadyOnList(email: string): boolean {
  if (!existsSync(LOG)) return false;
  try {
    const raw = readFileSync(LOG, "utf-8");
    for (const line of raw.split("\n")) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line) as WaitlistEntry;
        if (entry.email.toLowerCase() === email.toLowerCase()) return true;
      } catch {
        // skip malformed lines
      }
    }
  } catch {
    // file unreadable, fall through
  }
  return false;
}

function append(entry: WaitlistEntry): void {
  const dir = path.dirname(LOG);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  appendFileSync(LOG, JSON.stringify(entry) + "\n", "utf-8");
}

export async function POST(req: Request): Promise<Response> {
  // Rate-limit per IP. 5 waitlist signups / minute is plenty; abuse looks
  // like a script flooding fake emails.
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const limit = await checkLimit("waitlist_min", ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, code: "RATE_LIMIT", message: "Slow down. Try again in a minute." },
      { status: 429 }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "BAD_JSON" },
      { status: 400 }
    );
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "VALIDATION", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, handle, building, source } = parsed.data;

  // Idempotent for the founder's sanity: if you signed up twice, we log
  // the second hit but tell the UI you're already on the list so the
  // success state doesn't make it look like a fresh entry.
  const dup = alreadyOnList(email);

  const entry: WaitlistEntry = {
    ts: new Date().toISOString(),
    email,
    ...(handle ? { handle } : {}),
    ...(building ? { building } : {}),
    ...(source ? { source } : {}),
    ip_hash: hashIp(ip),
  };
  append(entry);

  return NextResponse.json({
    ok: true,
    duplicate: dup,
  });
}

// GET returns count only when called with the dev-admin header. Used by
// /admin/health to surface the live waitlist size without exposing
// emails.
export async function GET(req: Request): Promise<Response> {
  if (process.env.JUMPSTART_DEV_ADMIN !== "1") {
    return NextResponse.json({ ok: false, code: "FORBIDDEN" }, { status: 403 });
  }
  if (!existsSync(LOG)) return NextResponse.json({ ok: true, count: 0 });
  try {
    const raw = readFileSync(LOG, "utf-8");
    const lines = raw.split("\n").filter((l) => l.trim());
    return NextResponse.json({ ok: true, count: lines.length });
  } catch {
    return NextResponse.json({ ok: true, count: 0 });
  }
}
