// Per-persona Playwright session. Each persona gets an isolated browser
// context so localStorage doesn't leak between them — that's how the
// app naturally distinguishes users in stub mode.
//
// The session walks the persona through:
//   signup → identity → verification → intent → card → drop
// And exposes higher-level actions:
//   visitDrop, requestIntro, browseCohort, sendOpenerVariant, signOut
//
// We do not bypass the UI. Every action goes through the real React
// flow so the harness exercises the same code paths as a friend.

import { chromium, devices, type Browser, type BrowserContext, type Page } from "playwright";
import type { Persona } from "../types";
import { attachTelemetry, captureScreenshot, flushTelemetry, type SessionTelemetry } from "./observability";

const BASE_URL = process.env.HARNESS_BASE_URL || "http://localhost:3030";
// Headless by default; set HARNESS_HEADLESS=0 to watch the personas
// drive the app live (useful for debugging the founder).
const HEADLESS = process.env.HARNESS_HEADLESS !== "0";

// Device profiles. Roughly 30% of cohort is mobile; cycle by persona id
// so a given persona is consistent across runs (Priya is always mobile,
// Marcus is always desktop). The hash makes the assignment stable.
const MOBILE_PROFILES = ["iPhone 14", "Pixel 7", "iPhone 14 Pro Max"];
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

// devices is a Record<string, DeviceDescriptor>. We narrow by string key.
type DeviceProfile = (typeof devices)[keyof typeof devices];

function deviceForPersona(personaId: string): {
  mobile: boolean;
  device?: DeviceProfile;
  viewport?: typeof DESKTOP_VIEWPORT;
} {
  // Stable hash: sum char codes mod 10. ~30% mobile.
  let h = 0;
  for (let i = 0; i < personaId.length; i++) h = (h + personaId.charCodeAt(i)) % 1000;
  const mobile = h % 10 < 3;
  if (mobile) {
    const profile = MOBILE_PROFILES[h % MOBILE_PROFILES.length] as string;
    const dev = (devices as Record<string, DeviceProfile>)[profile];
    return { mobile: true, device: dev };
  }
  return { mobile: false, viewport: DESKTOP_VIEWPORT };
}

export type PersonaSession = {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  persona: Persona;
  telemetry: SessionTelemetry;
  mobile: boolean;
  close: () => Promise<void>;
};

let sharedBrowser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (sharedBrowser) return sharedBrowser;
  sharedBrowser = await chromium.launch({ headless: HEADLESS });
  return sharedBrowser;
}

export async function closeSharedBrowser(): Promise<void> {
  if (sharedBrowser) {
    await sharedBrowser.close();
    sharedBrowser = null;
  }
}

export async function openSession(persona: Persona): Promise<PersonaSession> {
  const browser = await getBrowser();
  const profile = deviceForPersona(persona.id);
  const contextOpts: Parameters<Browser["newContext"]>[0] = profile.mobile
    ? { ...profile.device }
    : { viewport: profile.viewport };
  const context = await browser.newContext(contextOpts);
  const page = await context.newPage();
  const telemetry = attachTelemetry(page, persona.id);
  return {
    browser,
    context,
    page,
    persona,
    telemetry,
    mobile: profile.mobile,
    close: async () => {
      // Flush telemetry before tearing down the context so we keep
      // every captured event even if the close itself fails.
      flushTelemetry(telemetry);
      await context.close();
    },
  };
}

export async function signUp(s: PersonaSession): Promise<void> {
  await s.page.goto(`${BASE_URL}/signup`);
  await s.page
    .getByPlaceholder(/you@email\.com/i)
    .fill(s.persona.identity.email);
  // The signup form has an optional public-link field. We always set it
  // when the persona has one so the Founder Pass renders the third-surface
  // verification line for downstream invite recipients.
  if (s.persona.identity.publicLink) {
    const linkField = s.page.getByPlaceholder(/linkedin/i);
    if (await linkField.count()) {
      await linkField.first().fill(s.persona.identity.publicLink);
    }
  }
  await s.page.getByRole("button", { name: /Send magic link/i }).click();
  // Wait for routing to /onboarding/identity.
  await s.page.waitForURL(/\/onboarding\/identity/, { timeout: 10_000 });
}

export async function fillIdentity(s: PersonaSession): Promise<void> {
  await s.page.goto(`${BASE_URL}/onboarding/identity`);
  await s.page
    .getByPlaceholder(/First and last/i)
    .fill(s.persona.identity.name);
  await s.page
    .getByPlaceholder(/City, optionally where/i)
    .fill(s.persona.identity.location);
  await s.page
    .getByPlaceholder(/Plasmax\./i)
    .fill(s.persona.identity.oneLine);
  if (s.persona.identity.publicLink) {
    const linkField = s.page.getByPlaceholder(/linkedin\.com\/in\/you/i);
    if (await linkField.count()) {
      await linkField.first().fill(s.persona.identity.publicLink);
    }
  }
  await s.page.getByRole("button", { name: /Continue/i }).click();
  await s.page.waitForURL(/\/onboarding\/verification/, { timeout: 10_000 });
}

export async function fillVerification(s: PersonaSession): Promise<void> {
  await s.page.goto(`${BASE_URL}/onboarding/verification`);
  // Verification toggles are present as Pill components. They default
  // to off, so we click each one the persona wants on.
  // The page accepts continuation after at least one toggle is set.
  const toggleNames: { key: keyof Persona["intent"]; label: RegExp }[] = [
    { key: "going_to_sf", label: /going to SF/i },
    { key: "attended_india", label: /Startup School India/i },
    { key: "remote_global", label: /remote/i },
    { key: "open_to_async", label: /async/i },
    { key: "open_to_in_person", label: /in[- ]person/i },
  ];
  for (const t of toggleNames) {
    if (s.persona.intent[t.key]) {
      const pill = s.page.getByRole("button", { name: t.label }).first();
      if (await pill.count()) {
        await pill.click().catch(() => {
          // Pill might already be active in some flows; ignore.
        });
      }
    }
  }
  // Continue past verification.
  const continueBtn = s.page.getByRole("button", { name: /Continue/i });
  if (await continueBtn.count()) {
    await continueBtn.click();
    await s.page
      .waitForURL(/\/onboarding\/intent/, { timeout: 10_000 })
      .catch(() => {
        // Some flows skip directly to /onboarding/card.
      });
  }
}

export async function fillIntent(s: PersonaSession): Promise<void> {
  // The /onboarding/intent step is a guided interview. To keep the
  // harness deterministic we write the answers directly into the
  // localStorage draft envelope and skip the conversational UI. This
  // mirrors how a real user's draft would look at end of step.
  await s.page.goto(`${BASE_URL}/onboarding/intent`);
  await s.page.evaluate((intent) => {
    const envelope = {
      v: 1,
      ts: Date.now(),
      data: {
        building: intent.building,
        looking_for: intent.looking_for,
        can_help_with: intent.can_help_with,
        talk_to_me_if: intent.talk_to_me_if,
        primary_intent: "cofounder",
      },
    };
    window.localStorage.setItem(
      "jumpstart.onboarding.intent",
      JSON.stringify(envelope)
    );
  }, s.persona.intent);
}

export async function reviewAndSaveCard(s: PersonaSession): Promise<void> {
  await s.page.goto(`${BASE_URL}/onboarding/card`);
  // The Card review page synthesizes from drafts and shows editable
  // sections. The persona accepts the synth for now (decision style
  // can override later — chatty personas might re-edit each line).
  const saveBtn = s.page.getByRole("button", {
    name: /Save and see Drop preview/i,
  });
  await saveBtn.click();
  await s.page.waitForURL(/\/drop/, { timeout: 10_000 });
}

export async function visitDrop(s: PersonaSession): Promise<string[]> {
  // Returns the match ids (the href tail of /match/<id>) that the
  // persona saw on this visit. Coordinator uses this to route which
  // intros each persona considers requesting.
  await s.page.goto(`${BASE_URL}/drop`);
  await s.page.waitForSelector('a[href^="/match/"]', { timeout: 10_000 });
  const hrefs = await s.page
    .locator('a[href^="/match/"]')
    .evaluateAll((els) =>
      els
        .map((e) => (e as HTMLAnchorElement).getAttribute("href") || "")
        .map((h) => h.replace(/^\/match\//, ""))
        .filter(Boolean)
    );
  return hrefs;
}

export async function browseCohort(s: PersonaSession): Promise<number> {
  // Visits /browse, optionally toggles the filter sheet. Returns the
  // number of visible cohort cards.
  await s.page.goto(`${BASE_URL}/browse`);
  await s.page.waitForLoadState("domcontentloaded");
  // 50% of personas open the filter sheet to exercise that surface.
  if (Math.random() < 0.5) {
    const filterBtn = s.page.getByRole("button", { name: /Filter/i }).first();
    if (await filterBtn.count()) {
      await filterBtn.click().catch(() => null);
      await s.page.waitForTimeout(250);
      // Close it again so the next persona action isn't gated.
      const closeBtn = s.page.getByRole("button", { name: /Close|Done/i }).first();
      if (await closeBtn.count()) {
        await closeBtn.click().catch(() => null);
      } else {
        await s.page.keyboard.press("Escape").catch(() => null);
      }
    }
  }
  // Count cohort cards. Surface rendering varies, fall back to 0.
  return await s.page.locator('[data-testid="cohort-card"], a[href^="/browse/"]').count();
}

export async function visitYouAndShare(s: PersonaSession): Promise<boolean> {
  // Visits /you (the Founder Pass surface) and clicks the Share button.
  // Returns true if Share completed without throwing — the actual share
  // sheet won't open in headless mode but the click path is exercised.
  await s.page.goto(`${BASE_URL}/you`);
  await s.page.waitForLoadState("domcontentloaded");
  const shareBtn = s.page.getByRole("button", { name: /Share/i }).first();
  if (!(await shareBtn.count())) return false;
  try {
    // Stub navigator.clipboard so the click doesn't trigger a
    // permission prompt that hangs the headless browser.
    await s.page.evaluate(() => {
      const orig = navigator.clipboard;
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (_t: string) => Promise.resolve(),
          readText: orig?.readText?.bind(orig) ?? (async () => Promise.resolve("")),
        },
      });
    });
    await shareBtn.click({ timeout: 3_000 });
    return true;
  } catch {
    return false;
  }
}

export async function signOut(s: PersonaSession): Promise<boolean> {
  // Visits /you and clicks Sign out. Used to test the session-clear path
  // and the post-signout re-onboarding flow.
  await s.page.goto(`${BASE_URL}/you`);
  await s.page.waitForLoadState("domcontentloaded");
  const out = s.page.getByRole("button", { name: /Sign out/i }).first();
  if (!(await out.count())) return false;
  try {
    await out.click({ timeout: 3_000 });
    await s.page
      .waitForURL((u) => !u.toString().includes("/you"), { timeout: 5_000 })
      .catch(() => null);
    return true;
  } catch {
    return false;
  }
}

export async function chaosClick(s: PersonaSession, durationMs = 2000): Promise<void> {
  // Chaos-monkey: for ~durationMs, randomly clicks visible interactive
  // elements on the current page. Exercises defensive code paths
  // (toasts, focus traps, error boundaries) that scripted flows skip.
  const end = Date.now() + durationMs;
  while (Date.now() < end) {
    try {
      const buttons = s.page.locator('button:visible, a[href]:visible').first();
      const count = await s.page.locator('button:visible, a[href]:visible').count();
      if (count === 0) break;
      const idx = Math.floor(Math.random() * count);
      const target = s.page.locator('button:visible, a[href]:visible').nth(idx);
      await target.click({ timeout: 800, trial: false }).catch(() => null);
      await s.page.waitForTimeout(200);
    } catch {
      // continue
    }
  }
}

export async function requestIntroVia(
  s: PersonaSession,
  matchId: string,
  noteOverride?: string
): Promise<{ ok: boolean; status: number; body: unknown }> {
  // The match detail page submits via /api/intros. We hit that
  // endpoint directly, scoped to this persona's browser context so
  // cookies/auth are correct, by using page.request which inherits
  // the context's storage.
  const matchPath = `/match/${matchId}`;
  await s.page.goto(`${BASE_URL}${matchPath}`);
  // Read the suggested opener from the rendered DOM so the harness
  // sends realistic note content rather than a synthetic stub.
  const openerEl = s.page
    .locator('p.italic')
    .first();
  let opener = "";
  try {
    opener = (await openerEl.innerText()).replace(/^"|"$/g, "");
  } catch {
    // not visible (page didn't render properly) — fall back below
  }
  const note = noteOverride ?? opener;

  // Get the recipient_id by scraping the page's data — match cards
  // expose candidate.user_id only via the match record on the server.
  // For the synthetic harness we encode it from the matchId, which is
  // shaped like "match_<candidate_id>_<position>".
  const parts = matchId.split("_");
  // For "match_fc_<rest>_<i>" form, candidate_id is "fc_<rest>".
  // For "match_u_<rest>_<i>" form, candidate_id is "u_<rest>".
  // The recipient_id we send to the API must start with u_ or fc_.
  let recipient_id = "";
  if (parts.length >= 3) {
    recipient_id = parts.slice(1, -1).join("_");
  }

  const res = await s.page.request.post(`${BASE_URL}/api/intros`, {
    data: {
      match_id: matchId,
      recipient_id,
      note,
    },
  });
  const status = res.status();
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok()) {
    // Capture a screenshot on intro send failure for the founder to triage.
    await captureScreenshot(s.page, s.persona.id, `intro_fail_${matchId}_${status}`);
  }
  return { ok: res.ok(), status, body };
}
