// Central OTP types shared across the client facade, route handlers, and
// service module. The shapes here are the public contract: anything
// outside this file imports from here.
//
// Promotion path: the SendResult and VerifyResult shapes are stable.
// Real-mode adds new reasons (config_incomplete, delivery_failed) which
// the client facade must handle, but the existing reasons (rate_limit,
// invalid_target, expired, mismatch, no_pending) keep their meaning.

export type OtpChannel = "email" | "phone";

// What we persist client-side in stub mode AND what real-mode keeps as
// a non-sensitive cache (target + sent_at + expires_at + verified_at).
// The optional `code` is ONLY populated in stub mode; real-mode never
// stores plaintext code anywhere on the client.
export type OtpRecord = {
  target: string;
  sent_at: string;     // ISO
  expires_at: string;  // ISO, sent_at + 10 min by default
  verified_at?: string; // ISO once user submits matching code
  code?: string;       // stub-mode only
};

// Outcome of a send call. demo_code is populated only in stub mode for
// closed-beta self-verify; the verification page already hides it from
// the visible UI and only console.info-logs it. Real mode never returns
// demo_code.
//
// retry_after_ms is populated on rate_limit so the UI can disable the
// resend button for the right amount of time.
export type SendResult =
  | { ok: true; record: OtpRecord; demo_code?: string }
  | {
      ok: false;
      reason:
        | "rate_limit"
        | "invalid_target"
        | "config_incomplete"
        | "delivery_failed"
        | "internal";
      retry_after_ms?: number;
    };

// Outcome of a verify call. attempts_remaining is populated on mismatch
// so the UI can warn the user that they're approaching the brute-force
// throttle.
export type VerifyResult =
  | { ok: true; verified_at: string; target: string }
  | {
      ok: false;
      reason:
        | "no_pending"
        | "expired"
        | "mismatch"
        | "rate_limit"
        | "invalid_target"
        | "config_incomplete"
        | "internal";
      attempts_remaining?: number;
    };
