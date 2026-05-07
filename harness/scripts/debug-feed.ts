// Headless interaction test on /browse to find what "feed not working" means.
// Walks through: load page → check posts render → click compose → fill form
// → click post → verify card lands → click filter → verify filter works.

import { chromium } from "playwright";

const BASE = "http://localhost:3030";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      console.log(`  [console.${msg.type()}] ${msg.text()}`);
    }
  });
  page.on("pageerror", (err) => console.log(`  [pageerror] ${err.message}`));

  console.log("\n--- /browse load ---");
  await page.goto(`${BASE}/browse`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => null);

  const heading = await page.locator("h1").first().textContent();
  console.log(`heading: ${heading}`);

  const postsBefore = await page.locator('a[href^="/browse/"]').count();
  console.log(`post links rendered: ${postsBefore}`);

  // 1. Compose flow
  console.log("\n--- compose ---");
  const composeBtn = page.getByRole("button", { name: /Post something/i });
  const composeExists = (await composeBtn.count()) > 0;
  console.log(`compose button visible: ${composeExists}`);
  if (composeExists) {
    await composeBtn.click();
    await page.waitForTimeout(400);
    const titleInput = page.locator('input[placeholder*="title"]');
    const bodyArea = page.locator('textarea[placeholder*="Body"]');
    const titleSeen = (await titleInput.count()) > 0;
    const bodySeen = (await bodyArea.count()) > 0;
    console.log(`compose form opened: title=${titleSeen} body=${bodySeen}`);
    if (titleSeen && bodySeen) {
      await titleInput.fill("Debug ping from harness");
      await bodyArea.fill("If this lands the feed is fine. If it doesn't, we have a bug.");
      const postBtn = page.getByRole("button", { name: /^Post$/ });
      const postEnabled = await postBtn.isEnabled();
      console.log(`post button enabled: ${postEnabled}`);
      if (postEnabled) {
        await postBtn.click();
        await page.waitForTimeout(700);
        const postsAfter = await page.locator('a[href^="/browse/"]').count();
        console.log(`post links after submit: ${postsAfter} (was ${postsBefore})`);
      }
    }
  }

  // 2. Filter flow
  console.log("\n--- filter ---");
  const showChip = page.getByRole("button", { name: /^Show$/ }).last();
  if ((await showChip.count()) > 0) {
    await showChip.click();
    await page.waitForTimeout(400);
    const showOnly = await page.locator('a[href^="/browse/"]').count();
    console.log(`posts when filter=Show: ${showOnly}`);
    await page.getByRole("button", { name: /^All$/ }).click();
    await page.waitForTimeout(300);
  }

  // 3. Click a post -> detail page
  console.log("\n--- click post ---");
  const firstPost = page.locator('a[href^="/browse/"]').first();
  if ((await firstPost.count()) > 0) {
    const href = await firstPost.getAttribute("href");
    console.log(`navigating to ${href}`);
    await firstPost.click();
    await page.waitForLoadState("networkidle").catch(() => null);
    const url = page.url();
    const detailHeading = await page.locator("h1").first().textContent().catch(() => null);
    console.log(`landed at: ${url}`);
    console.log(`detail h1: ${detailHeading}`);
  }

  // 4. Check localStorage state directly
  console.log("\n--- localStorage check ---");
  const ls = await page.evaluate(() => {
    const out: Record<string, string | null> = {};
    for (const k of [
      "jumpstart.posts",
      "jumpstart.posts.votes",
      "jumpstart.posts.seeded",
    ]) {
      const v = localStorage.getItem(k);
      out[k] = v ? `[${v.length} chars]` : null;
    }
    return out;
  });
  console.log(JSON.stringify(ls, null, 2));

  await ctx.close();
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
