// Cross-site snapshot script. Same pattern as browser-use/browser-harness:
// open browser → goto URL → wait for load → capture_screenshot → loop.
// Used here via Playwright (CDP under the hood) so we don't have to install
// Python uv tooling. Output goes to experiments/screens/cross-site/.
//
// Why: after running design-extract (designlang) on 8 reference sites, we
// have JSON tokens — but visual side-by-side at fixed viewport is the
// fastest way to sanity-check "does my landing page hold up next to
// Linear / Vercel / Stripe / Anthropic at the same width?" Open all 5
// in one folder, look at them next to each other.
//
// browser-harness's helpers.py teaches the right primitives:
//   new_tab(url) → wait_for_load() → capture_screenshot(path)
// We mirror that here in TS.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";

const OUT = path.resolve(
  __dirname,
  "..",
  "..",
  "experiments",
  "screens",
  "cross-site"
);

const SITES: { name: string; url: string }[] = [
  { name: "00-jumpstart", url: "https://jumpstart-khaki.vercel.app/" },
  { name: "01-linear", url: "https://linear.app" },
  { name: "02-vercel", url: "https://vercel.com" },
  { name: "03-cursor", url: "https://cursor.com" },
  { name: "04-anthropic", url: "https://www.anthropic.com" },
  { name: "05-stripe", url: "https://stripe.com" },
  { name: "06-yc-ss", url: "https://www.startupschool.org" },
];

async function snap(): Promise<void> {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      // Pass a real-looking UA so cookie banners / bot walls don't throw us
      // into a degraded layout. browser-harness uses real Chrome which
      // sidesteps this; we approximate with a desktop UA string.
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
    });
    for (const s of SITES) {
      const page = await ctx.newPage();
      const start = Date.now();
      try {
        await page.goto(s.url, { waitUntil: "networkidle", timeout: 25000 });
      } catch (e) {
        // Networkidle can time out on heavy sites (Stripe, Vercel ship a
        // lot of JS). Fall back to domcontentloaded + a settle delay.
        await page.goto(s.url, {
          waitUntil: "domcontentloaded",
          timeout: 20000,
        });
        await page.waitForTimeout(2500);
      }
      // Settle: dismiss obvious cookie-banner overlays that block a clean
      // shot. We don't actually click them (privacy + variability), just
      // press Escape twice in case the banner uses a keyboard listener.
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(800);
      const out = path.join(OUT, `${s.name}-laptop.png`);
      await page.screenshot({ path: out, fullPage: false });
      console.log(`${s.name}: ${(Date.now() - start)}ms → ${out}`);
      await page.close();
    }
    await ctx.close();
  } finally {
    await browser.close();
  }
  console.log(`done: ${OUT}`);
}

snap().catch((e) => {
  console.error(e);
  process.exit(1);
});
