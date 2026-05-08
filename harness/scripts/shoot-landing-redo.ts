// Snapshot the new landing redo across the page (laptop + phone) so the
// founder can verify the design without spinning the dev server.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";

const URL = process.env.LANDING_URL || "https://jumpstart-khaki.vercel.app/";
const OUT = path.resolve(__dirname, "..", "..", "experiments", "screens", "landing-redo");

async function main(): Promise<void> {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT, "01-hero-laptop.png") });
    await page.evaluate(() => window.scrollBy({ top: 800 }));
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, "02-marquee-laptop.png") });
    await page.evaluate(() => window.scrollBy({ top: 900 }));
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, "03-howitworks-laptop.png") });
    await page.evaluate(() => window.scrollBy({ top: 1200 }));
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, "04-founderpass-laptop.png") });
    await page.evaluate(() => window.scrollBy({ top: 1500 }));
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, "05-counter-positioning-laptop.png") });
    await page.evaluate(() => window.scrollBy({ top: 1500 }));
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, "06-closing-cta-laptop.png") });
    await ctx.close();

    const phoneCtx = await browser.newContext({ viewport: { width: 414, height: 896 } });
    const phonePage = await phoneCtx.newPage();
    await phonePage.goto(URL, { waitUntil: "networkidle", timeout: 30000 });
    await phonePage.waitForTimeout(600);
    await phonePage.screenshot({ path: path.join(OUT, "10-hero-phone.png") });
    await phonePage.evaluate(() => window.scrollBy({ top: 700 }));
    await phonePage.waitForTimeout(400);
    await phonePage.screenshot({ path: path.join(OUT, "11-howitworks-phone.png") });
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
