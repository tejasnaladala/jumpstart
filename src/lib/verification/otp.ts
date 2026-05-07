// One-time-password verification. Closed-beta-of-10 ships with a
// stub-mode OTP that generates a 6-digit code client-side and surfaces
// it back to the user in a toast (so they can self-verify the flow
// without real SMS / email infra). The same shape promotes to real
// Twilio / Resend / PocketBase delivery the moment we wire it.
//
// Why client-side stub?
//   - Real beta needs SMS (Twilio ~$0.008/msg) and transactional
//     email (Resend / SES). Both want billing setup that we don't
//     pay for during the closed-beta-of-10.
//   - Friend testing the flow needs to see how OTP feels: send,
//     receive, type, confirm. Stub mode preserves the UX without
//     burning $.
//
// What changes when we move to PocketBase + real OTP delivery:
//   - generateAndStore() calls a server endpoint that signs the code
//     and dispatches via Twilio (phone) / Resend (email).
//   - The code is NOT returned to the client. The user reads it from
//     SMS / email and types it back.
//   - Server-side verify() checks against the signed token.
//
// Stub-mode storage layout (localStorage):
//   jumpstart.otp.email = { code, target, sent_at, expires_at, verified_at? }
//   jumpstart.otp.phone = { same shape, target = phone digits }

export type OtpChannel = "email" | "phone";

export type OtpRecord = {
  code: string;        // 6 digits
  target: string;      // email address or phone digits
  sent_at: string;     // ISO
  expires_at: string;  // ISO, sent_at + 10 min
  verified_at?: string; // ISO once user submits matching code
};

const KEY = (ch: OtpChannel) => `jumpstart.otp.${ch}`;
const RATE_LIMIT_KEY = (ch: OtpChannel) => `jumpstart.otp.${ch}.rate`;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 send per minute per channel

function generateCode(): string {
  // Six digits, leading zeros preserved.
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
    // non-fatal
  }
}

export function clear(ch: OtpChannel): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY(ch));
  } catch {
    // non-fatal
  }
}

function isRateLimited(ch: OtpChannel): boolean {
  if (typeof window === "undefined") return false;
  const last = window.localStorage.getItem(RATE_LIMIT_KEY(ch));
  if (!last) return false;
  const lastMs = Number.parseInt(last, 10);
  if (!Number.isFinite(lastMs)) return false;
  return Date.now() - lastMs < RATE_LIMIT_WINDOW_MS;
}

function markRateLimit(ch: OtpChannel): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RATE_LIMIT_KEY(ch), String(Date.now()));
  } catch {
    // non-fatal
  }
}

export type SendResult =
  | { ok: true; record: OtpRecord; demo_code?: string }
  | { ok: false; reason: "rate_limit" | "invalid_target" | "internal" };

// Send a fresh OTP to the channel. Stub mode generates the code and
// returns it as `demo_code` so the UI can display it in a toast.
// Real mode (when wired to PocketBase + Twilio/Resend) does NOT
// return the code; the user receives it via SMS / email.
export function send(ch: OtpChannel, target: string): SendResult {
  const trimmed = target.trim();
  if (!trimmed) return { ok: false, reason: "invalid_target" };
  if (ch === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { ok: false, reason: "invalid_target" };
  }
  if (ch === "phone") {
    const digits = trimmed.replace(/[^\d+]/g, "");
    if (digits.length < 7 || digits.length > 15) {
      return { ok: false, reason: "invalid_target" };
    }
  }
  if (isRateLimited(ch)) {
    return { ok: false, reason: "rate_limit" };
  }
  const code = generateCode();
  const now = new Date();
  const rec: OtpRecord = {
    code,
    target: trimmed,
    sent_at: now.toISOString(),
    expires_at: new Date(now.getTime() + 10 * 60 * 1000).toISOString(),
  };
  save(ch, rec);
  markRateLimit(ch);
  // Stub-mode: return the code so the UI can show it. Closed-beta
  // friend testing needs this; real beta with Twilio/Resend will
  // delete the demo_code field and the user reads it from their
  // device.
  return { ok: true, record: rec, demo_code: code };
}

export type VerifyResult =
  | { ok: true; verified_at: string }
  | { ok: false; reason: "no_pending" | "expired" | "mismatch" };

export function verify(ch: OtpChannel, submitted: string): VerifyResult {
  const rec = load(ch);
  if (!rec) return { ok: false, reason: "no_pending" };
  if (Date.now() > new Date(rec.expires_at).getTime()) {
    return { ok: false, reason: "expired" };
  }
  const cleaned = submitted.replace(/[^\d]/g, "");
  if (cleaned !== rec.code) return { ok: false, reason: "mismatch" };
  const now = new Date().toISOString();
  save(ch, { ...rec, verified_at: now });
  return { ok: true, verified_at: now };
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
