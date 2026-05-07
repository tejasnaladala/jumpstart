// Server-side hashing for OTP targets and codes. SHA-256 with a
// server-only pepper. The pepper is the only secret in the chain;
// without it, even a leaked database row is hard to brute-force back
// to the original code (1M possibilities is small, but rate limits
// and code expiry keep the window short).
//
// Domain separation: target hash and code hash use different input
// shapes so a code hash can never collide with a target hash.

import { createHash, timingSafeEqual } from "node:crypto";
import type { OtpChannel } from "./types";

export function hashTarget(input: {
  channel: OtpChannel;
  target: string; // already normalized
  pepper: string;
}): string {
  const h = createHash("sha256");
  h.update("target");
  h.update("\x00");
  h.update(input.channel);
  h.update("\x00");
  h.update(input.target);
  h.update("\x00");
  h.update(input.pepper);
  return h.digest("hex");
}

export function hashOtpCode(input: {
  channel: OtpChannel;
  target: string; // already normalized
  code: string;
  pepper: string;
}): string {
  const h = createHash("sha256");
  h.update("code");
  h.update("\x00");
  h.update(input.channel);
  h.update("\x00");
  h.update(input.target);
  h.update("\x00");
  h.update(input.code);
  h.update("\x00");
  h.update(input.pepper);
  return h.digest("hex");
}

// Constant-time comparison of hex strings. Lengths are validated first
// to avoid leaking length via early-exit.
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  // Both strings same length; convert via Buffer.from to bytes. Length
  // is even because hex.
  try {
    const ba = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}
