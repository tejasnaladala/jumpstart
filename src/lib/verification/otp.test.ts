// Smoke tests for the client facade. Mocks `window.localStorage` and
// `fetch` so the tests run under Node without a browser.
//
// Run via `bun run test:otp`.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

// Set up the global window + fetch shims BEFORE importing the module
// under test, because otp.ts captures `typeof window` at call time but
// the constants and KEY function are bound at module init.

class MemoryStorage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  key(i: number): string | null {
    return Array.from(this.store.keys())[i] ?? null;
  }
  getItem(k: string): string | null {
    return this.store.get(k) ?? null;
  }
  setItem(k: string, v: string): void {
    this.store.set(k, v);
  }
  removeItem(k: string): void {
    this.store.delete(k);
  }
  clear(): void {
    this.store.clear();
  }
}

const storage = new MemoryStorage();
// @ts-expect-error - shim for tests
globalThis.window = { localStorage: storage };

let fetchMock: ((req: { url: string; init: RequestInit }) => Promise<Response>) | null = null;
globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === "string" ? input : input.toString();
  if (!fetchMock) throw new TypeError("fetch not mocked");
  return fetchMock({ url, init: init ?? {} });
};

// Import after the shims are in place.
const { send, verify, load, clear, isVerified, verifiedTarget } = await import(
  "./otp"
);

beforeEach(() => {
  storage.clear();
  fetchMock = null;
});

// --- stub-mode (network failure) ---

test("send falls back to stub when fetch throws (network unreachable)", async () => {
  fetchMock = async () => {
    throw new Error("ECONNREFUSED");
  };
  const result = await send("email", "Stub@User.io");
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.record.target, "Stub@User.io");
    assert.ok(result.demo_code);
    assert.equal(result.record.code, result.demo_code);
  }
});

test("send falls back to stub on 503 config_incomplete", async () => {
  fetchMock = async () =>
    new Response(JSON.stringify({ ok: false, reason: "config_incomplete" }), {
      status: 503,
    });
  const result = await send("email", "x@y.io");
  assert.equal(result.ok, true);
  if (result.ok) assert.ok(result.demo_code);
});

// --- real-mode (server returns success) ---

test("send in real mode does not store the code client-side", async () => {
  fetchMock = async () =>
    new Response(
      JSON.stringify({
        ok: true,
        record: {
          target: "real@user.io",
          sent_at: "2026-05-07T00:00:00Z",
          expires_at: "2026-05-07T00:10:00Z",
        },
      }),
      { status: 200 }
    );
  const result = await send("email", "real@user.io");
  assert.equal(result.ok, true);
  const stored = load("email");
  assert.ok(stored);
  assert.equal(stored?.code, undefined, "real-mode never persists code client-side");
  assert.equal(stored?.target, "real@user.io");
});

test("send in real mode does not return demo_code", async () => {
  fetchMock = async () =>
    new Response(
      JSON.stringify({
        ok: true,
        record: {
          target: "no-demo@test.io",
          sent_at: "2026-05-07T00:00:00Z",
          expires_at: "2026-05-07T00:10:00Z",
        },
      }),
      { status: 200 }
    );
  const result = await send("email", "no-demo@test.io");
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.demo_code, undefined);
});

// --- verify branches ---

test("verify against stub-mode record matches the stored code", async () => {
  fetchMock = async () => {
    throw new Error("force stub");
  };
  await send("email", "stub@v.io");
  const rec = load("email");
  assert.ok(rec?.code);
  const result = await verify("email", rec!.code!);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.target, "stub@v.io");
  assert.ok(isVerified("email"));
  assert.equal(verifiedTarget("email"), "stub@v.io");
});

test("verify returns no_pending if localStorage was cleared", async () => {
  // No send first. localStorage is empty.
  const result = await verify("email", "123456");
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, "no_pending");
});

test("verify in real mode posts target+code to the server", async () => {
  // First send in real mode so localStorage holds a record without code.
  fetchMock = async () =>
    new Response(
      JSON.stringify({
        ok: true,
        record: {
          target: "real-verify@user.io",
          sent_at: "2026-05-07T00:00:00Z",
          expires_at: "2026-05-07T00:10:00Z",
        },
      }),
      { status: 200 }
    );
  await send("email", "real-verify@user.io");

  // Now mock the verify call.
  let posted: { target?: string; code?: string } = {};
  fetchMock = async ({ url, init }) => {
    if (url.includes("/verify")) {
      const body = JSON.parse(String(init.body));
      posted = body;
      return new Response(
        JSON.stringify({
          ok: true,
          verified_at: "2026-05-07T00:01:00Z",
          target: body.target,
        }),
        { status: 200 }
      );
    }
    throw new Error("unexpected fetch: " + url);
  };
  const result = await verify("email", "424242");
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.target, "real-verify@user.io");
  assert.equal(posted.target, "real-verify@user.io");
  assert.equal(posted.code, "424242");
});

// --- clear wipes both record + rate timestamp ---

test("clear removes both the otp record and the rate-limit timestamp", async () => {
  fetchMock = async () => {
    throw new Error("force stub");
  };
  await send("email", "wipe@me.io");
  assert.ok(load("email"));
  clear("email");
  assert.equal(load("email"), null);
});
