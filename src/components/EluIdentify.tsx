"use client";
import { useEffect } from "react";

// ELU Analytics: attach the signed-in user's email to their session so product
// analytics can attribute behavior to a real person instead of an anonymous
// device. Optional - safe to remove if you don't want to share email with
// analytics. See https://elu.dev for docs.
//
// The script tag itself is loaded in the root layout (src/app/layout.tsx) so
// elu.dev's snippet sits in <head>. This component only handles the identify
// call once the session is known. The (app) shell layout passes the email in
// after getSession() resolves.

declare global {
  interface Window {
    elu?: {
      identify: (id: string, traits?: Record<string, unknown>) => void;
      reset: () => void;
    };
  }
}

type Props = {
  email: string | null;
};

export function EluIdentify({ email }: Props) {
  useEffect(() => {
    if (!email) return;
    if (typeof window === "undefined" || !window.elu) return;
    try {
      window.elu.identify(email, { email });
    } catch {
      // Ad-blockers and privacy modes may stub window.elu in unexpected
      // ways; never let analytics throw into the app.
    }
  }, [email]);
  return null;
}

// Imperative reset on sign-out. Called from /you's logout handler.
export function eluReset(): void {
  if (typeof window === "undefined" || !window.elu) return;
  try {
    window.elu.reset();
  } catch {
    // see EluIdentify
  }
}
