// OTP service. Orchestrates the send and verify flows server-side:
//   - normalize the target (email lowercases, phone E.164)
//   - rate-limit on hashed-target identifier
//   - hash target + code with the server-only pepper
//   - persist to the OTP store (PocketBase by default)
//   - dispatch via the delivery module (Resend/Twilio)
//
// Designed for dependency injection: every external collaborator is
// passed via OtpServiceDeps so unit tests can substitute fakes for the
// store, delivery, clock, random source, and rate-limit checker. In
// production the deps default to the real implementations.

import { randomInt } from "node:crypto";
import { checkLimit } from "@/lib/auth/rate-limit";
import {
  getOtpServerConfig,
  rateLimitIdentifier,
  type OtpServerConfig,
  type OtpRealConfig,
} from "./config";
import { hashOtpCode, hashTarget, timingSafeEqualHex } from "./hash";
import { normalizeOtpTarget } from "./target";
import { createPocketBaseOtpCodeStore, type OtpCodeStore } from "./store";
import { deliverOtp } from "./delivery";
import type { OtpChannel, SendResult, VerifyResult } from "./types";

// Test seam. None of these are exposed in production; every default
// resolves to the real implementation.
export type OtpServiceDeps = {
  config?: OtpServerConfig;
  store?: OtpCodeStore;
  now?: () => Date;
  randomCode?: () => string;
  deliver?: typeof deliverOtp;
  checkLimit?: typeof checkLimit;
};

function defaultRandomCode(): string {
  // Six-digit zero-padded code, generated with crypto.randomInt for
  // uniform distribution. randomInt is sync.
  const n = randomInt(0, 1_000_000);
  return String(n).padStart(6, "0");
}

function resolveStoreForRealMode(config: OtpRealConfig): OtpCodeStore {
  return createPocketBaseOtpCodeStore(config);
}

export async function sendOtp(
  input: { channel: OtpChannel; target: string },
  deps: OtpServiceDeps = {}
): Promise<SendResult> {
  const config = deps.config ?? getOtpServerConfig();
  const now = (deps.now ?? (() => new Date()))();
  const randomCode = deps.randomCode ?? defaultRandomCode;
  const limiter = deps.checkLimit ?? checkLimit;

  const normalized = normalizeOtpTarget(input.channel, input.target);
  if (!normalized) {
    return { ok: false, reason: "invalid_target" };
  }

  // Rate limit on hashed identifier so neither the limiter nor logs
  // hold plaintext target. We compute a stub-mode hash without the
  // pepper for the limiter ID so closed-beta still rate-limits sanely.
  const limiterPepper =
    config.mode === "real" ? config.otpHashPepper : "stub-pepper";
  const targetHash = hashTarget({
    channel: input.channel,
    target: normalized,
    pepper: limiterPepper,
  });
  const limit = await limiter(
    "otp_send_min",
    rateLimitIdentifier(input.channel, targetHash)
  );
  if (!limit.allowed) {
    return {
      ok: false,
      reason: "rate_limit",
      retry_after_ms: limit.reset_in_ms,
    };
  }

  const code = randomCode();
  const sentAt = now.toISOString();
  const expiresAt = new Date(
    now.getTime() +
      (config.mode === "real" ? config.ttlMs : 10 * 60 * 1000)
  ).toISOString();

  if (config.mode === "stub") {
    // Stub mode never touches PocketBase / Resend / Twilio. The
    // route handler returns config_incomplete and the client falls
    // back to localStorage, which is the existing closed-beta-of-2
    // behavior. We return demo_code so the client console.info-logs
    // it for debugging. Plaintext code on the wire here is fine
    // because stub mode is local-only.
    return {
      ok: true,
      record: {
        target: normalized,
        sent_at: sentAt,
        expires_at: expiresAt,
        code,
      },
      demo_code: code,
    };
  }

  const realConfig = config;
  const store = deps.store ?? resolveStoreForRealMode(realConfig);
  const codeHash = hashOtpCode({
    channel: input.channel,
    target: normalized,
    code,
    pepper: realConfig.otpHashPepper,
  });
  const realTargetHash = hashTarget({
    channel: input.channel,
    target: normalized,
    pepper: realConfig.otpHashPepper,
  });

  try {
    await store.create({
      channel: input.channel,
      target_hash: realTargetHash,
      code_hash: codeHash,
      sent_at: sentAt,
      expires_at: expiresAt,
    });
  } catch {
    return { ok: false, reason: "internal" };
  }

  const delivery = await (deps.deliver ?? deliverOtp)(
    { channel: input.channel, target: normalized, code },
    realConfig
  );
  if (!delivery.ok) {
    return { ok: false, reason: "delivery_failed" };
  }

  // Real mode: client never receives the code. The record returned to
  // the client contains target + sent_at + expires_at only so the
  // client facade can store pending metadata in localStorage.
  return {
    ok: true,
    record: {
      target: normalized,
      sent_at: sentAt,
      expires_at: expiresAt,
    },
  };
}

export async function verifyOtp(
  input: { channel: OtpChannel; target: string; code: string },
  deps: OtpServiceDeps = {}
): Promise<VerifyResult> {
  const config = deps.config ?? getOtpServerConfig();
  const now = (deps.now ?? (() => new Date()))();

  const normalized = normalizeOtpTarget(input.channel, input.target);
  if (!normalized) {
    return { ok: false, reason: "invalid_target" };
  }
  const submitted = input.code.replace(/[^\d]/g, "");
  if (!/^\d{6}$/.test(submitted)) {
    return { ok: false, reason: "mismatch" };
  }

  if (config.mode === "stub") {
    // Stub-mode verify is unreachable from the API path because the
    // route handler returns config_incomplete on stub. The client
    // facade does its own localStorage-based verify when stub is
    // active. We return mismatch as a defensive default if the
    // service is invoked directly in stub mode.
    return { ok: false, reason: "mismatch" };
  }

  const realConfig = config;
  const store = deps.store ?? resolveStoreForRealMode(realConfig);
  const targetHash = hashTarget({
    channel: input.channel,
    target: normalized,
    pepper: realConfig.otpHashPepper,
  });

  let row;
  try {
    row = await store.findLatestUnverified(input.channel, targetHash);
  } catch {
    return { ok: false, reason: "internal" };
  }
  if (!row) {
    return { ok: false, reason: "no_pending" };
  }

  // Brute-force throttle: if attempts already at max, refuse without
  // checking the code so we don't reveal whether the submitted code
  // would have matched.
  if (row.attempts >= realConfig.maxAttempts) {
    return { ok: false, reason: "rate_limit", attempts_remaining: 0 };
  }

  if (now > new Date(row.expires_at)) {
    return { ok: false, reason: "expired" };
  }

  const expected = hashOtpCode({
    channel: input.channel,
    target: normalized,
    code: submitted,
    pepper: realConfig.otpHashPepper,
  });
  if (!timingSafeEqualHex(expected, row.code_hash)) {
    let attemptsRemaining: number;
    try {
      const next = await store.incrementAttempts(row.id);
      attemptsRemaining = Math.max(0, realConfig.maxAttempts - next);
    } catch {
      attemptsRemaining = Math.max(
        0,
        realConfig.maxAttempts - (row.attempts + 1)
      );
    }
    return { ok: false, reason: "mismatch", attempts_remaining: attemptsRemaining };
  }

  const verifiedAt = now.toISOString();
  try {
    await store.markVerified(row.id, verifiedAt);
  } catch {
    return { ok: false, reason: "internal" };
  }

  return { ok: true, verified_at: verifiedAt, target: normalized };
}
