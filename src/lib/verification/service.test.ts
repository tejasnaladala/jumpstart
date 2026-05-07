// Smoke tests for the OTP service. Run via `bun run test:otp` (which
// uses tsx --test under the hood). All external collaborators are
// dependency-injected so we never hit PocketBase / Resend / Twilio.

import { test } from "node:test";
import assert from "node:assert/strict";
import { sendOtp, verifyOtp } from "./service";
import type { OtpCodeStore, OtpCodeRecord } from "./store";
import type { OtpRealConfig } from "./config";
import type { OtpChannel } from "./types";

function makeRealConfig(overrides: Partial<OtpRealConfig> = {}): OtpRealConfig {
  return {
    mode: "real",
    pocketbaseUrl: "http://test-pb",
    pocketbaseAdminEmail: "admin@test",
    pocketbaseAdminPassword: "test-pass",
    otpHashPepper: "test-pepper-32-bytes-hex-aaaaaa",
    resendApiKey: "re_test",
    otpFromEmail: "noreply@test.dev",
    twilioAccountSid: "AC_test",
    twilioAuthToken: "test-token",
    twilioFromPhone: "+15555550100",
    ttlMs: 10 * 60 * 1000,
    maxAttempts: 5,
    ...overrides,
  };
}

function makeFakeStore(): {
  store: OtpCodeStore;
  rows: OtpCodeRecord[];
} {
  const rows: OtpCodeRecord[] = [];
  let nextId = 1;
  const store: OtpCodeStore = {
    async create(input) {
      const row: OtpCodeRecord = {
        id: `r${nextId++}`,
        channel: input.channel,
        target_hash: input.target_hash,
        code_hash: input.code_hash,
        sent_at: input.sent_at,
        expires_at: input.expires_at,
        attempts: 0,
      };
      rows.push(row);
      return row;
    },
    async findLatestUnverified(channel, targetHash) {
      const candidates = rows
        .filter(
          (r) =>
            r.channel === channel &&
            r.target_hash === targetHash &&
            !r.verified_at
        )
        .sort((a, b) => (a.sent_at < b.sent_at ? 1 : -1));
      return candidates[0] ?? null;
    },
    async incrementAttempts(id) {
      const row = rows.find((r) => r.id === id);
      if (!row) throw new Error("not found");
      row.attempts += 1;
      return row.attempts;
    },
    async markVerified(id, verifiedAt) {
      const row = rows.find((r) => r.id === id);
      if (!row) throw new Error("not found");
      // Honor the conditional contract: if already verified by a
      // concurrent caller, return null so the service treats the second
      // verify as a mismatch.
      if (row.verified_at) return null;
      row.verified_at = verifiedAt;
      return row;
    },
    async expirePriorUnverified(channel, targetHash, asOfIso) {
      let count = 0;
      for (const r of rows) {
        if (
          r.channel === channel &&
          r.target_hash === targetHash &&
          !r.verified_at &&
          r.expires_at > asOfIso
        ) {
          r.expires_at = asOfIso;
          count++;
        }
      }
      return count;
    },
  };
  return { store, rows };
}

function makeAllowingLimiter() {
  return async () => ({
    allowed: true,
    remaining: 1,
    reset_in_ms: 60_000,
    help: "",
  });
}

function makeBlockingLimiter() {
  return async () => ({
    allowed: false,
    remaining: 0,
    reset_in_ms: 30_000,
    help: "",
  });
}

const fixedNow = new Date("2026-05-07T00:00:00Z");
const okDeliver = async () => ({ ok: true as const });

// --- send happy path ---

test("sendOtp real mode persists hash and dispatches", async () => {
  const config = makeRealConfig();
  const { store, rows } = makeFakeStore();
  let delivered: { channel: OtpChannel; target: string; code: string } | null =
    null;
  const result = await sendOtp(
    { channel: "email", target: "Tejas@example.com" },
    {
      config,
      store,
      now: () => fixedNow,
      randomCode: () => "123456",
      checkLimit: makeAllowingLimiter(),
      deliver: async (input) => {
        delivered = input;
        return { ok: true };
      },
    }
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.record.target, "tejas@example.com");
    assert.equal(result.record.code, undefined, "real mode never returns code");
  }
  assert.equal(rows.length, 1);
  assert.notEqual(rows[0].code_hash, "123456", "code is hashed");
  assert.notEqual(rows[0].target_hash, "tejas@example.com", "target is hashed");
  assert.deepEqual(delivered, {
    channel: "email",
    target: "tejas@example.com",
    code: "123456",
  });
});

// --- invalid target ---

test("sendOtp returns invalid_target for malformed email", async () => {
  const result = await sendOtp(
    { channel: "email", target: "not-an-email" },
    {
      config: makeRealConfig(),
      store: makeFakeStore().store,
      now: () => fixedNow,
      randomCode: () => "111111",
      checkLimit: makeAllowingLimiter(),
      deliver: okDeliver,
    }
  );
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, "invalid_target");
});

test("sendOtp normalizes US local phone to E.164", async () => {
  let delivered: string | null = null;
  const result = await sendOtp(
    { channel: "phone", target: "(415) 555 0123" },
    {
      config: makeRealConfig(),
      store: makeFakeStore().store,
      now: () => fixedNow,
      randomCode: () => "654321",
      checkLimit: makeAllowingLimiter(),
      deliver: async (input) => {
        delivered = input.target;
        return { ok: true };
      },
    }
  );
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.record.target, "+14155550123");
  assert.equal(delivered, "+14155550123");
});

// --- rate limit ---

test("sendOtp returns rate_limit when limiter blocks", async () => {
  const result = await sendOtp(
    { channel: "email", target: "x@y.io" },
    {
      config: makeRealConfig(),
      store: makeFakeStore().store,
      now: () => fixedNow,
      randomCode: () => "000000",
      checkLimit: makeBlockingLimiter(),
      deliver: okDeliver,
    }
  );
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.reason, "rate_limit");
    assert.equal(result.retry_after_ms, 30_000);
  }
});

// --- delivery failure ---

test("sendOtp returns delivery_failed when provider throws", async () => {
  const { store, rows } = makeFakeStore();
  const result = await sendOtp(
    { channel: "email", target: "y@z.io" },
    {
      config: makeRealConfig(),
      store,
      now: () => fixedNow,
      randomCode: () => "999999",
      checkLimit: makeAllowingLimiter(),
      deliver: async () => ({ ok: false, reason: "delivery_failed" }),
    }
  );
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, "delivery_failed");
  // Row was created but not marked verified; treat as audit trail.
  assert.equal(rows.length, 1);
});

// --- verify happy path ---

test("verifyOtp marks verified on matching code", async () => {
  const config = makeRealConfig();
  const { store, rows } = makeFakeStore();
  await sendOtp(
    { channel: "email", target: "match@test.io" },
    {
      config,
      store,
      now: () => fixedNow,
      randomCode: () => "424242",
      checkLimit: makeAllowingLimiter(),
      deliver: okDeliver,
    }
  );
  const result = await verifyOtp(
    { channel: "email", target: "match@test.io", code: "424242" },
    { config, store, now: () => new Date(fixedNow.getTime() + 5 * 60 * 1000) }
  );
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.target, "match@test.io");
  assert.ok(rows[0].verified_at);
});

// --- mismatch ---

test("verifyOtp returns mismatch + decrements attempts_remaining", async () => {
  const config = makeRealConfig();
  const { store, rows } = makeFakeStore();
  await sendOtp(
    { channel: "email", target: "miss@test.io" },
    {
      config,
      store,
      now: () => fixedNow,
      randomCode: () => "111111",
      checkLimit: makeAllowingLimiter(),
      deliver: okDeliver,
    }
  );
  const result = await verifyOtp(
    { channel: "email", target: "miss@test.io", code: "222222" },
    { config, store, now: () => new Date(fixedNow.getTime() + 60_000) }
  );
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.reason, "mismatch");
    assert.equal(result.attempts_remaining, 4);
  }
  assert.equal(rows[0].attempts, 1);
});

// --- attempts exhausted ---

test("verifyOtp returns rate_limit once attempts hit max", async () => {
  const config = makeRealConfig({ maxAttempts: 2 });
  const { store, rows } = makeFakeStore();
  await sendOtp(
    { channel: "email", target: "max@test.io" },
    {
      config,
      store,
      now: () => fixedNow,
      randomCode: () => "555555",
      checkLimit: makeAllowingLimiter(),
      deliver: okDeliver,
    }
  );
  rows[0].attempts = 2;
  const result = await verifyOtp(
    { channel: "email", target: "max@test.io", code: "555555" },
    { config, store, now: () => new Date(fixedNow.getTime() + 60_000) }
  );
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, "rate_limit");
});

// --- expired ---

test("verifyOtp returns expired past TTL", async () => {
  const config = makeRealConfig({ ttlMs: 60_000 });
  const { store } = makeFakeStore();
  await sendOtp(
    { channel: "email", target: "exp@test.io" },
    {
      config,
      store,
      now: () => fixedNow,
      randomCode: () => "888888",
      checkLimit: makeAllowingLimiter(),
      deliver: okDeliver,
    }
  );
  const result = await verifyOtp(
    { channel: "email", target: "exp@test.io", code: "888888" },
    {
      config,
      store,
      now: () => new Date(fixedNow.getTime() + 5 * 60_000), // past ttl
    }
  );
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, "expired");
});

// --- no pending ---

test("verifyOtp returns no_pending when store is empty", async () => {
  const result = await verifyOtp(
    { channel: "email", target: "ghost@test.io", code: "777777" },
    {
      config: makeRealConfig(),
      store: makeFakeStore().store,
      now: () => fixedNow,
    }
  );
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, "no_pending");
});
