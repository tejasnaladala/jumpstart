// OTP server config resolution. Reads the env once and decides whether
// real mode (PocketBase + Resend + Twilio) or stub mode is active.
// JUMPSTART_FORCE_STUBS=1 always wins. Otherwise we go real only if
// every required env var is present.
//
// The shape includes a `reason` and `missing` array on the stub branch
// so the route handler can return 503 config_incomplete with a useful
// log line (server-side only, never returned to the client).

import type { OtpChannel } from "./types";

export type OtpRealConfig = {
  mode: "real";
  pocketbaseUrl: string;
  pocketbaseAdminEmail: string;
  pocketbaseAdminPassword: string;
  otpHashPepper: string;
  resendApiKey: string;
  otpFromEmail: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioFromPhone: string;
  ttlMs: number;       // 10 * 60 * 1000
  maxAttempts: number; // 5
};

export type OtpStubConfig = {
  mode: "stub";
  reason: "force_stubs" | "missing_env";
  missing: string[];
};

export type OtpServerConfig = OtpRealConfig | OtpStubConfig;

const DEFAULT_TTL_MS = 10 * 60 * 1000;
const DEFAULT_MAX_ATTEMPTS = 5;

const REQUIRED_REAL_KEYS = [
  "OTP_HASH_PEPPER",
  "OTP_FROM_EMAIL",
  "RESEND_API_KEY",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_FROM_PHONE",
  "POCKETBASE_ADMIN_EMAIL",
  "POCKETBASE_ADMIN_PASSWORD",
] as const;

// Either POCKETBASE_URL or NEXT_PUBLIC_POCKETBASE_URL is acceptable;
// the public one is what the browser sees and the server can reuse it.
function resolvePocketbaseUrl(): string | undefined {
  return (
    process.env.POCKETBASE_URL ||
    process.env.NEXT_PUBLIC_POCKETBASE_URL ||
    undefined
  );
}

export function getOtpServerConfig(): OtpServerConfig {
  if (process.env.JUMPSTART_FORCE_STUBS === "1") {
    return { mode: "stub", reason: "force_stubs", missing: [] };
  }

  const missing: string[] = [];
  for (const key of REQUIRED_REAL_KEYS) {
    if (!process.env[key]) missing.push(key);
  }

  const pbUrl = resolvePocketbaseUrl();
  if (!pbUrl) missing.push("POCKETBASE_URL");

  if (missing.length > 0) {
    return { mode: "stub", reason: "missing_env", missing };
  }

  return {
    mode: "real",
    pocketbaseUrl: pbUrl as string,
    pocketbaseAdminEmail: process.env.POCKETBASE_ADMIN_EMAIL as string,
    pocketbaseAdminPassword: process.env.POCKETBASE_ADMIN_PASSWORD as string,
    otpHashPepper: process.env.OTP_HASH_PEPPER as string,
    resendApiKey: process.env.RESEND_API_KEY as string,
    otpFromEmail: process.env.OTP_FROM_EMAIL as string,
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID as string,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN as string,
    twilioFromPhone: process.env.TWILIO_FROM_PHONE as string,
    ttlMs: DEFAULT_TTL_MS,
    maxAttempts: DEFAULT_MAX_ATTEMPTS,
  };
}

// Helper for the route handler: given a channel + target, return the
// rate-limit identifier we use throughout the service. We use the
// hashed target so logs and limiter keys never carry plaintext.
export function rateLimitIdentifier(
  channel: OtpChannel,
  targetHash: string
): string {
  return `${channel}:${targetHash}`;
}
