// Browser notification for drop delivery. Replaces the old "we'll
// email you when matches drop" promise with a real in-tab + system
// notification combo. Email notifications are wired separately via
// the agent layer (deferred until Resend is configured for closed
// beta of 10).
//
// Permission flow: on first /drop visit after onboarding, we ask once.
// If the user grants, every drop fires a system notification. If they
// deny, we fall back to in-tab toast only and stop asking.

const PERM_ASKED_KEY = "jumpstart.notify.asked";

export type PermissionState = "default" | "granted" | "denied" | "unsupported";

export function notificationState(): PermissionState {
  if (typeof window === "undefined") return "unsupported";
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission as PermissionState;
}

export function hasAsked(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(PERM_ASKED_KEY) === "1";
}

// Ask once. Idempotent: if already granted/denied, returns the current
// state without re-prompting. Non-fatal if the API isn't supported.
export async function requestNotificationPermission(): Promise<PermissionState> {
  if (typeof window === "undefined") return "unsupported";
  if (typeof Notification === "undefined") return "unsupported";
  const current = Notification.permission as PermissionState;
  if (current !== "default") return current;
  try {
    const next = await Notification.requestPermission();
    window.localStorage.setItem(PERM_ASKED_KEY, "1");
    return next as PermissionState;
  } catch {
    return "denied";
  }
}

export function fireDropNotification(args: {
  title?: string;
  body: string;
  url?: string;
}): void {
  if (typeof window === "undefined") return;
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  try {
    const n = new Notification(args.title || "Your Jumpstart drop is in", {
      body: args.body,
      // Browser may use a default icon when this URL doesn't resolve;
      // the favicon is fine as a fallback.
      icon: "/icon",
      tag: "jumpstart-drop", // collapses repeat fires into one banner
    });
    if (args.url) {
      n.onclick = () => {
        window.focus();
        try {
          window.location.href = args.url as string;
        } catch {
          // tolerate
        }
      };
    }
  } catch {
    // some browsers throw on weird state; non-fatal
  }
}
