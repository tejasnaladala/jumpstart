// OTP delivery via Resend (email) or Twilio (phone). Pure HTTP fetch,
// no SDKs — both providers expose stable REST APIs and we keep the
// dependency footprint small.
//
// What this file deliberately does NOT do:
//   - Log the code, ever. Logs are limited to provider-side error
//     messages and the channel/target identifier. The code itself is
//     short-lived and one-time, but treating it as a secret across
//     transport is the right posture.
//   - Branded HTML email. The email body is a 5-line plaintext.
//     Editorial brand polish lives in a future issue.

import type { OtpRealConfig } from "./config";
import type { OtpChannel } from "./types";

export type OtpDeliveryInput = {
  channel: OtpChannel;
  target: string; // already normalized
  code: string;
};

export type OtpDeliveryResult =
  | { ok: true }
  | { ok: false; reason: "delivery_failed"; detail?: string };

const RESEND_ENDPOINT = "https://api.resend.com/emails";

// Twilio uses /Accounts/<sid>/Messages.json with Basic auth.
function twilioEndpoint(accountSid: string): string {
  return `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`;
}

function emailBody(code: string): { subject: string; text: string } {
  return {
    subject: `Your Jumpstart code: ${code}`,
    text: [
      `Your verification code is ${code}.`,
      "",
      "It expires in 10 minutes. If you did not request this, ignore the email.",
      "",
      "— Jumpstart",
    ].join("\n"),
  };
}

function smsBody(code: string): string {
  return `Jumpstart: ${code} is your verification code. It expires in 10 minutes.`;
}

async function deliverEmail(
  target: string,
  code: string,
  config: OtpRealConfig
): Promise<OtpDeliveryResult> {
  const { subject, text } = emailBody(code);
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.otpFromEmail,
        to: target,
        subject,
        text,
      }),
    });
    if (!res.ok) {
      const detail = await safeReadText(res);
      return { ok: false, reason: "delivery_failed", detail };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      reason: "delivery_failed",
      detail: e instanceof Error ? e.message : String(e),
    };
  }
}

async function deliverSms(
  target: string,
  code: string,
  config: OtpRealConfig
): Promise<OtpDeliveryResult> {
  // Twilio Messages API expects application/x-www-form-urlencoded.
  const body = new URLSearchParams({
    To: target,
    From: config.twilioFromPhone,
    Body: smsBody(code),
  });
  const auth = Buffer.from(
    `${config.twilioAccountSid}:${config.twilioAuthToken}`,
    "utf-8"
  ).toString("base64");
  try {
    const res = await fetch(twilioEndpoint(config.twilioAccountSid), {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!res.ok) {
      const detail = await safeReadText(res);
      return { ok: false, reason: "delivery_failed", detail };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      reason: "delivery_failed",
      detail: e instanceof Error ? e.message : String(e),
    };
  }
}

async function safeReadText(res: Response): Promise<string | undefined> {
  try {
    const text = await res.text();
    // Cap at 500 chars so error logs stay sane.
    return text.slice(0, 500);
  } catch {
    return undefined;
  }
}

export async function deliverOtp(
  input: OtpDeliveryInput,
  config: OtpRealConfig
): Promise<OtpDeliveryResult> {
  if (input.channel === "email") {
    return deliverEmail(input.target, input.code, config);
  }
  return deliverSms(input.target, input.code, config);
}
