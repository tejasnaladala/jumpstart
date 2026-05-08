// Snapshot the new comprehensive match cards. Scrolls into the bento
// section and captures the full card heights at laptop + phone widths.

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
  "bento"
);

async function main(): Promise<void> {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 1100 },
    });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(800);

    // Scroll to the bento section.
    await page.evaluate(() => {
      const headers = Array.from(
        document.querySelectorAll("h2, .ed-serial")
      );
      const target = headers.find((el) =>
        (el.textContent || "").toLowerCase().includes("real builders")
      );
      target?.scrollIntoView({ behavior: "auto", block: "start" });
    });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT, "01-bento-top.png") });

    // Scroll a bit further to capture the bottom of the cards.
    await page.evaluate(() => window.scrollBy({ top: 700 }));
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, "02-bento-mid.png") });

    await page.evaluate(() => window.scrollBy({ top: 700 }));
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, "03-bento-bottom.png") });

    await ctx.close();

    // Phone capture
    const phoneCtx = await browser.newContext({
      viewport: { width: 414, height: 896 },
    });
    const phonePage = await phoneCtx.newPage();
    await phonePage.goto(URL, { waitUntil: "networkidle", timeout: 30000 });
    await phonePage.waitForTimeout(800);
    await phonePage.evaluate(() => {
      const headers = Array.from(
        document.querySelectorAll("h2, .ed-serial")
      );
      const target = headers.find((el) =>
        (el.textContent || "").toLowerCase().includes("real builders")
      );
      target?.scrollIntoView({ behavior: "auto", block: "start" });
    });
    await phonePage.waitForTimeout(600);
    await phonePage.screenshot({ path: path.join(OUT, "10-bento-phone.png") });
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
