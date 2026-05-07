// One-time-password verification, client facade.
//
// Public surface (load-bearing — see CONTRIBUTING.md and the issue #2
// plan; the verification page imports these):
//   send(channel, target):   Promise<SendResult>
//   verify(channel, code):   Promise<VerifyResult>
//   isVerified(channel):     boolean
//   verifiedTarget(channel): string | null
//   load, save, clear:       OtpRecord helpers (sync, localStorage)
//
// What changed (May 7, issue #2):
//   send and verify are now async. They call the new server endpoints
//   /api/verification/otp/send and /api/verification/otp/verify when
//   real mode is configured server-side. If the server returns 503
//   config_incomplete (closed-beta-of-2 stub), the facade falls back
//   to a localStorage stub so the demo never breaks. The localStorage
//   helpers stay synchronous because they only touch the browser.
//
// What does NOT change:
//   - The verification page continues to call sendOtp(...) and
//     verifyOtp(...) by the same names. The diff there is two `await`
//     keywords.
//   - Stub mode never persists the code to a server. Real mode never
//     stores the code on the client; only target + sent_at + expires_at.
//
// Storage layout (localStorage):
//   jumpstart.otp.email = OtpRecord ({code} present in stub only)
//   jumpstart.otp.phone = OtpRecord
//   jumpstart.otp.<ch>.rate = ms timestamp of last send for stub-mode
//                              throttle (real mode uses server limiter)

import type {
  OtpChannel,
  OtpRecord,
  SendResult,
  VerifyResult,
} from "./types";

export type { OtpChannel, OtpRecord, SendResult, VerifyResult };

const KEY = (ch: OtpChannel) => `jumpstart.otp.${ch}`;
const RATE_LIMIT_KEY = (ch: OtpChannel) => `jumpstart.otp.${ch}.rate`;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const STUB_TTL_MS = 10 * 60 * 1000;

function generateCode(): string {
  // Six digits, leading zeros preserved. Math.random is fine for
  // stub-mode demo codes; real-mode codes come from server-side
  // crypto.randomInt.
  const n = Math.floor(Math.random() * 1_000_000);
  return String(n).padStart(6, "0");
}

export function load(ch: OtpChannel): OtpRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY(ch));
    if (!raw) return null;
    return JSON.parse(raw) as OtpRecord;
  } catch {
    return null;
  }
}

export function save(ch: OtpChannel, rec: OtpRecord): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY(ch), JSON.stringify(rec));
  } catch {
    // non-fatal: privacy mode or quota
  }
}

export function clear(ch: OtpChannel): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY(ch));
    window.localStorage.removeItem(RATE_LIMIT_KEY(ch));
  } catch {
    // non-fatal
  }
}

function isStubRateLimited(ch: OtpChannel): boolean {
  if (typeof window === "undefined") return false;
  const last = window.localStorage.getItem(RATE_LIMIT_KEY(ch));
  if (!last) return false;
  const lastMs = Number.parseInt(last, 10);
  if (!Number.isFinite(lastMs)) return false;
  return Date.now() - lastMs < RATE_LIMIT_WINDOW_MS;
}

function markStubRateLimit(ch: OtpChannel): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RATE_LIMIT_KEY(ch), String(Date.now()));
  } catch {
    // non-fatal
  }
}

// Send a fresh OTP. Real mode hits the server; stub mode generates a
// code locally and surfaces it as demo_code so closed-beta self-verify
// keeps working without a real Resend/Twilio backend.
export async function send(
  ch: OtpChannel,
  target: string
): Promise<SendResult> {
  const trimmed = target.trim();
  if (!trimmed) return { ok: false, reason: "invalid_target" };

  // Try real mode first. If the server says config_incomplete, fall
  // back to stub. If the network is unreachable, fall back to stub
  // too (closed-beta posture; real beta will surface the failure).
  let serverResult: SendResult | null = null;
  let serverConfigIncomplete = false;
  try {
    const res = await fetch("/api/verification/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: ch, target: trimmed }),
    });
    const body = (await res.json().catch(() => null)) as SendResult | null;
    if (res.status === 503 && body && !body.ok && body.reason === "config_incomplete") {
      serverConfigIncomplete = true;
    } else if (body) {
      serverResult = body;
    }
  } catch {
    serverConfigIncomplete = true;
  }

  if (!serverConfigIncomplete && serverResult) {
    if (serverResult.ok) {
      // Real mode: persist the metadata only (no code). Pending target
      // is the seed for verify().
      save(ch, serverResult.record);
    }
    return serverResult;
  }

  // Stub mode (config incomplete OR network failure).
  if (isStubRateLimited(ch)) {
    return { ok: false, reason: "rate_limit" };
  }

  const code = generateCode();
  const now = new Date();
  const rec: OtpRecord = {
    target: trimmed,
    sent_at: now.toISOString(),
    expires_at: new Date(now.getTime() + STUB_TTL_MS).toISOString(),
    code,
  };
  save(ch, rec);
  markStubRateLimit(ch);
  return { ok: true, record: rec, demo_code: code };
}

// Verify a submitted code. Real mode ships the pending target from
// localStorage to the server; the server compares the hash.
// Stub mode compares against the localStorage-stored code.
export async function verify(
  ch: OtpChannel,
  submitted: string
): Promise<VerifyResult> {
  const rec = load(ch);
  if (!rec) return { ok: false, reason: "no_pending" };

  const cleaned = submitted.replace(/[^\d]/g, "");
  if (!cleaned) return { ok: false, reason: "mismatch" };

  // Stub-mode rec carries `code`. If it does, we're in stub mode.
  if (rec.code) {
    if (Date.now() > new Date(rec.expires_at).getTime()) {
      return { ok: false, reason: "expired" };
    }
    if (cleaned !== rec.code) {
      return { ok: false, reason: "mismatch" };
    }
    const verifiedAt = new Date().toISOString();
    save(ch, { ...rec, verified_at: verifiedAt });
    return { ok: true, verified_at: verifiedAt, target: rec.target };
  }

  // Real mode: send target + code to the verify endpoint. The pending
  // target is in the localStorage record.
  let serverResult: VerifyResult | null = null;
  try {
    const res = await fetch("/api/verification/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: ch,
        target: rec.target,
        code: cleaned,
      }),
    });
    const body = (await res.json().catch(() => null)) as VerifyResult | null;
    if (body) serverResult = body;
  } catch {
    return { ok: false, reason: "internal" };
  }

  if (serverResult && serverResult.ok) {
    save(ch, { ...rec, verified_at: serverResult.verified_at });
  }
  return serverResult ?? { ok: false, reason: "internal" };
}

export function isVerified(ch: OtpChannel): boolean {
  const rec = load(ch);
  return Boolean(rec?.verified_at);
}

export function verifiedTarget(ch: OtpChannel): string | null {
  const rec = load(ch);
  if (!rec || !rec.verified_at) return null;
  return rec.target;
}
