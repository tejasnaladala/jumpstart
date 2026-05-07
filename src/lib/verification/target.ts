// Target normalization for OTP. Email gets trim + lowercase; phone
// gets E.164 via libphonenumber-js with US default country for numbers
// that omit the country code. Anything that doesn't normalize cleanly
// returns null and the service maps it to invalid_target.
//
// The /min build of libphonenumber-js is ~50 KB minified; we use it
// instead of /max so server bundles stay small. Coverage of the country
// metadata is sufficient for the closed-beta-of-50 cohort.

import { parsePhoneNumberFromString } from "libphonenumber-js/min";
import type { OtpChannel } from "./types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmailTarget(target: string): string | null {
  const trimmed = target.trim().toLowerCase();
  if (!trimmed) return null;
  if (trimmed.length > 254) return null;
  if (!EMAIL_RE.test(trimmed)) return null;
  return trimmed;
}

// Phone normalization. We default to US for numbers that omit the
// country code; users in India, Singapore, etc. should include +<cc>
// (the verification UI already shows the +1 415 555 0123 placeholder
// to nudge them). Returns E.164 (e.g. "+14155550123") or null.
//
// libphonenumber-js handles a wide range of input formats: spaces,
// parens, dashes, dots, leading zeros. We don't pre-clean.
export function normalizePhoneTarget(target: string): string | null {
  const trimmed = target.trim();
  if (!trimmed) return null;
  try {
    const parsed = parsePhoneNumberFromString(trimmed, "US");
    if (!parsed) return null;
    if (!parsed.isValid()) return null;
    return parsed.number; // E.164 form (already includes +)
  } catch {
    return null;
  }
}

export function normalizeOtpTarget(
  channel: OtpChannel,
  target: string
): string | null {
  if (channel === "email") return normalizeEmailTarget(target);
  return normalizePhoneTarget(target);
}
