import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT || "3030";
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    video: process.env.CI ? "retain-on-failure" : "off",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "bun run dev",
    url: BASE_URL,
    // CI never reuses an existing server. Locally we still reuse so the
    // dev server stays warm, but e2e specs assume stub mode; if someone
    // is running with real keys, those test runs will hit live agents.
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      JUMPSTART_ALLOW_STUB: "1",
      JUMPSTART_FORCE_STUBS: "1",
      PORT,
    },
  },
});
