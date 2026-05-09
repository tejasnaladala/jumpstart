import { test, expect } from '@playwright/test';

test('walkthrough', async ({ page }) => {
  await page.goto('http://localhost:3030');
  await page.screenshot({ path: 'landing_page.png' });

  const signupLink = page.getByRole('link', { name: /get started|sign up/i });
  if (await signupLink.isVisible()) {
    await signupLink.click();
  } else {
    await page.goto('http://localhost:3030/onboarding');
  }

  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'onboarding_step1.png' });
});
