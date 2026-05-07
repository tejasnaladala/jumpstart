// Detailed: visit /browse and /browse/[id], screenshot both, dump h1+h2+h3
// text and count comments + post body. Find what user means by "not working".

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";

const BASE = "http://localhost:3030";
const OUT = path.resolve(__dirname, "..", "..", "experiments", "screens", "feed-debug");

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`[console.error] ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`[pageerror] ${err.message}`));
  page.on("dialog", async (d) => {
    console.log(`  [dialog] ${d.type()} "${d.message()}"`);
    await d.dismiss();
  });
  page.on("requestfailed", (req) => errors.push(`[requestfailed] ${req.url()} - ${req.failure()?.errorText}`));

  // 1. /browse
  await page.goto(`${BASE}/browse`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => null);
  await page.screenshot({ path: path.join(OUT, "01-feed.png"), fullPage: true });
  const browseHeadings = await page.locator("h1, h2, h3").allTextContents();
  console.log("\n[/browse] headings:", browseHeadings);
  const postLinks = await page.locator('a[href^="/browse/"]').count();
  console.log(`[/browse] post links: ${postLinks}`);
  const composeButton = await page.getByRole("button", { name: /Post something/i }).count();
  console.log(`[/browse] compose visible: ${composeButton > 0}`);

  // 2. Detail page
  const firstHref = await page.locator('a[href^="/browse/"]').first().getAttribute("href");
  if (firstHref) {
    await page.goto(`${BASE}${firstHref}`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => null);
    await page.screenshot({ path: path.join(OUT, "02-detail.png"), fullPage: true });
    const detailHeadings = await page.locator("h1, h2, h3").allTextContents();
    console.log(`\n[/browse/${firstHref?.slice(8)}] headings:`, detailHeadings);
    const postBody = await page.locator("main, section").first().textContent().catch(() => null);
    console.log(`[/detail] body length: ${postBody?.length ?? 0}`);
    const commentBox = await page.locator("textarea").count();
    console.log(`[/detail] comment textarea: ${commentBox > 0}`);
  }

  // 3. console errors
  console.log(`\n--- errors collected: ${errors.length} ---`);
  errors.slice(0, 10).forEach((e) => console.log(`  ${e}`));

  await ctx.close();
  await browser.close();
  console.log(`\nshots: ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
