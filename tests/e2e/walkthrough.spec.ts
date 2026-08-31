import { expect, test } from "@playwright/test";

test("walkthrough", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Private founder map");
  await page.screenshot({ path: testInfo.outputPath("landing-page.png") });

  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: /Get your Founder Drop/i })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("signup.png") });
});
