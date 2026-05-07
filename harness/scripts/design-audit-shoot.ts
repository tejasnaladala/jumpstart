// Snapshot every key route at laptop + phone widths so the founder can
// see the redesign at a glance. Saves PNGs to experiments/screens/.
//
// Run: bun run harness/scripts/design-audit-shoot.ts

import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const BASE = process.env.HARNESS_BASE_URL || "http://localhost:3030";
const OUT = path.resolve(__dirname, "..", "..", "experiments", "screens");

const ROUTES = [
  { path: "/", name: "01-home" },
  { path: "/signup", name: "02-signup" },
  { path: "/onboarding/identity", name: "03-onboarding-identity" },
  { path: "/onboarding/intent", name: "04-onboarding-intent" },
  { path: "/onboarding/card", name: "05-onboarding-card" },
  { path: "/onboarding/verification", name: "06-onboarding-verification" },
  { path: "/drop", name: "07-drop" },
  { path: "/browse", name: "08-browse" },
  { path: "/inbox", name: "09-inbox" },
  { path: "/you", name: "10-you" },
  { path: "/pass/me", name: "11-pass" },
  { path: "/admin", name: "12-admin" },
  { path: "/admin/curate", name: "13-admin-curate" },
  { path: "/admin/moderation", name: "14-admin-moderation" },
];

async function shoot(page: import("playwright").Page, route: string, name: string, w: number, h: number, suffix: string) {
  await page.setViewportSize({ width: w, height: h });
  await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => null);
  await page.waitForTimeout(400);
  const file = path.join(OUT, `${name}-${suffix}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`  ${suffix.padEnd(8)} -> ${file}`);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    timeout: 60_000,
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  for (const r of ROUTES) {
    console.log(`\n[${r.name}]`);
    try {
      await shoot(page, r.path, r.name, 1440, 900, "laptop");
    } catch (e) {
      console.log(`  laptop FAILED: ${(e as Error).message}`);
    }
  }

  await context.close();
  const phoneCtx = await browser.newContext({
    viewport: { width: 414, height: 896 },
  });
  const phonePage = await phoneCtx.newPage();
  for (const r of ROUTES) {
    try {
      await shoot(phonePage, r.path, r.name, 414, 896, "phone");
    } catch (e) {
      console.log(`  phone FAILED ${r.name}: ${(e as Error).message}`);
    }
  }
  await phoneCtx.close();

  await browser.close();
  console.log(`\nDone. Screens at ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
