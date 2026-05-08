// Snapshot the new pre-landing hero (smoke shader + code shimmer + big
// JUMPSTART wordmark). Captures both the top viewport and the body
// section after a single smooth-scroll, on laptop + phone widths.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";

const URL = "https://jumpstart-khaki.vercel.app/";
const OUT = path.resolve(
  __dirname,
  "..",
  "..",
  "experiments",
  "screens",
  "prelanding"
);

async function main(): Promise<void> {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    // Laptop
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: "networkidle", timeout: 30000 });
    // Give the smoke shader a beat to fade in.
    await page.waitForTimeout(1400);
    // Move the cursor in a small arc to spawn code shimmer sparks.
    await page.mouse.move(400, 400);
    await page.waitForTimeout(150);
    await page.mouse.move(700, 380);
    await page.waitForTimeout(150);
    await page.mouse.move(900, 460);
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT, "01-prelanding-laptop.png") });

    // Scroll into the body section
    await page.evaluate(() => {
      const el = document.getElementById("landing-body");
      el?.scrollIntoView({ behavior: "auto", block: "start" });
    });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT, "02-body-laptop.png") });
    await ctx.close();

    // Phone
    const phoneCtx = await browser.newContext({ viewport: { width: 414, height: 896 } });
    const phonePage = await phoneCtx.newPage();
    await phonePage.goto(URL, { waitUntil: "networkidle", timeout: 30000 });
    await phonePage.waitForTimeout(1400);
    await phonePage.screenshot({ path: path.join(OUT, "10-prelanding-phone.png") });
    await phoneCtx.close();
  } finally {
    await browser.close();
  }
  console.log("done:", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
