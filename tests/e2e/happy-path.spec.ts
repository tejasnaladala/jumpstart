import { test, expect } from "@playwright/test";

test.describe("happy path", () => {
  test("landing page renders with hero and CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Jumpstart/i);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Jumpstart");
    await expect(page.getByRole("link", { name: /Get my Founder Drop/i }).first()).toBeVisible();
  });

  test("signup form requires a real email", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: /Get your Founder Drop/i })).toBeVisible();
    await page.getByPlaceholder(/you@email.com/i).fill("not-an-email");
    await page.getByRole("button", { name: /Send magic link/i }).click();
    // Toast appears with error styling. We verify navigation did NOT happen.
    await expect(page).toHaveURL(/\/signup/);
  });

  test("signup advances to onboarding identity step", async ({ page }) => {
    await page.goto("/signup");
    await page.getByPlaceholder(/you@email.com/i).fill("test@beta.dev");
    await page.getByPlaceholder(/linkedin/i).fill("https://linkedin.com/in/test");
    await page.getByRole("button", { name: /Send magic link/i }).click();
    await expect(page).toHaveURL(/\/onboarding\/identity/, { timeout: 5_000 });
  });

  test("onboarding identity advances to verification", async ({ page }) => {
    await page.goto("/onboarding/identity");
    await page.getByPlaceholder(/First and last/i).fill("Test User");
    await page.getByPlaceholder(/City, optionally where/i).fill("San Francisco");
    await page.getByPlaceholder(/Plasmax\./i).fill("Building cohort tools for SS 2026.");
    await page.getByRole("button", { name: /Continue/i }).click();
    await expect(page).toHaveURL(/\/onboarding\/verification/);
  });

  test("drop page shows three matches", async ({ page }) => {
    await page.goto("/drop");
    await expect(page.getByText(/Your Drop/i).first()).toBeVisible();
    await expect(page.getByText(/3 worth meeting/i)).toBeVisible();
    // Three match cards (the link wrapper of each MatchCard).
    const cards = page.locator('a[href^="/match/"]');
    await expect(cards).toHaveCount(3);
  });

  test("match detail loads with explanation and opener", async ({ page }) => {
    await page.goto("/drop");
    const firstCard = page.locator('a[href^="/match/"]').first();
    await firstCard.click();
    await expect(page).toHaveURL(/\/match\//);
    await expect(page.getByText(/Why you should meet/i)).toBeVisible();
    await expect(page.getByText(/Suggested opener/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Request intro/i })).toBeVisible();
  });

  test("browse with filter shows a tag panel", async ({ page }) => {
    await page.goto("/browse");
    await expect(page.getByText(/Browse/i).first()).toBeVisible();
    await page.getByRole("button", { name: /Filter/i }).click();
    await expect(page.getByText(/Filter by tag/i)).toBeVisible();
  });

  test("you tab shows trust tier and signout", async ({ page }) => {
    await page.goto("/you");
    // Trust tier is the deterministic anchor here; the card heading copy
    // varies with the user's Founder Card content.
    await expect(page.getByText(/Trust tier/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign out/i })).toBeVisible();
  });
});

test.describe("api auth and rate limit", () => {
  test("api/health is public", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ready).toBe(true);
  });

  test("api/intros validates body", async ({ request }) => {
    const res = await request.post("/api/intros", {
      data: { not: "valid" },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("VALIDATION");
  });

  test("api/intros blocks spam notes", async ({ request }) => {
    const res = await request.post("/api/intros", {
      data: {
        match_id: "match_test1",
        recipient_id: "u_maya",
        note: "Click http://earn-money.fast to make $5000 a day from home now",
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("SAFETY_BLOCK");
    // Body must NOT leak internal reasons.
    expect(body.reasons).toBeUndefined();
  });

  test("api/intros accepts clean notes", async ({ request }) => {
    const res = await request.post("/api/intros", {
      data: {
        match_id: "match_test1",
        recipient_id: "u_maya",
        note: "Want to compare notes on agent evals over coffee?",
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.accepted).toBe(true);
  });

  test("api/cron/retention rejects without secret", async ({ request }) => {
    const res = await request.get("/api/cron/retention");
    // 503 when CRON_SECRET is not configured (dev), or 403 if it is and the
    // header is missing/wrong. Either is correct.
    expect([403, 503]).toContain(res.status());
  });
});
