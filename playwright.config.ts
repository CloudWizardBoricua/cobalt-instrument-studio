/**
 * Browser regression configuration for the local simulator, not physical HMI qualification.
 * CI uses installed Playwright Chromium; local Windows runs use Edge unless overridden.
 * Serial tests and reduced motion keep controlled-clock replays and captures repeatable.
 * Traces/screenshots may contain environment data: JSON redaction does not sanitize them.
 */
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  retries: 0,
  // Do not automatically retain developer Git metadata in reports.
  captureGitInfo: { commit: false, diff: false },
  // Generated local results are sanitized before the workflow uploads selected reports.
  reporter: [["list"], ["json", { outputFile: ".local/e2e-results.json" }]],
  use: {
    baseURL: "http://127.0.0.1:5173",
    viewport: { width: 1440, height: 1100 },
    reducedMotion: "reduce",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    channel: process.env.CI
      ? undefined
      : process.env.PW_BROWSER_CHANNEL || "msedge",
  },
  // Strict port prevents fallback when launching. Locally, confirm any reused 5173 server is this project.
  webServer: {
    command: "npm run dev -- --port 5173 --strictPort",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
