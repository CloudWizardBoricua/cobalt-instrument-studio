import { expect, test } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

test("desktop controls update real telemetry, pause, and reset", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByText("SIMULATED — NOT LIVE EQUIPMENT", { exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-testid^="gauge-"]')).toHaveCount(6);
  const initial = await page.getByTestId("value-rpm").innerText();
  const start = Date.now();
  await page.getByLabel("Operating mode").selectOption("High Load");
  await page
    .getByRole("button", { name: "Start simulation", exact: true })
    .click();
  await expect(page.getByTestId("simulation-time")).toHaveText("00:03", {
    timeout: 6500,
  });
  const elapsedMs = Date.now() - start;
  await expect(page.getByTestId("value-rpm")).not.toHaveText(initial);
  await page.getByRole("button", { name: "Pause simulation" }).click();
  const paused = await page.getByTestId("value-rpm").innerText();
  await page.waitForTimeout(1100);
  await expect(page.getByTestId("value-rpm")).toHaveText(paused);
  await expect(page.getByTestId("session-status")).toHaveText(
    "SIMULATION PAUSED",
  );
  await page.getByRole("button", { name: "Reset session" }).click();
  await expect(page.getByTestId("sample-count")).toHaveText("1 / 240");
  await expect(page.getByTestId("session-status")).toHaveText("READY TO START");
  await mkdir(".local", { recursive: true });
  await writeFile(
    ".local/browser-measurements.json",
    JSON.stringify(
      {
        realtimeSimulationSecondsObserved: 3,
        wallMillisecondsToObserve: elapsedMs,
        javascriptErrors: errors,
        browser: "Microsoft Edge Chromium",
        desktop: { width: 1440, height: 1100 },
      },
      null,
      2,
    ),
  );
  expect(errors).toEqual([]);
});

test("normal ramp runs all instruments and changes selected trend series", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button", { name: "Run Normal operating ramp" }).click();
  await page.clock.runFor(35000);
  await expect(page.getByTestId("operating-mode")).toHaveText("Normal");
  await expect(page.getByTestId("diagnostic-status")).toHaveText("Normal");
  await expect(page.getByTestId("value-rpm")).toHaveText(/17\d\d/);
  await page.getByLabel("Trend series").selectOption("coolantTemp");
  await expect(
    page.getByRole("img", { name: /Coolant temperature trend/ }),
  ).toBeVisible();
  await expect(page.getByTestId("scenario-explainer")).toContainText(
    "Sequence complete",
  );
  await page
    .getByRole("button", { name: "Replay scenario", exact: true })
    .click();
  await expect(page.getByTestId("simulation-time")).toHaveText("00:00");
  await expect(page.getByTestId("value-rpm")).toHaveText("800");
});

test("overheat warning escalates, acknowledgment records review, reset resolves", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button", { name: "Run Coolant overheat" }).click();
  await page.clock.runFor(17500);
  await page.getByRole("button", { name: "Diagnostics", exact: true }).click();
  await expect(page.getByTestId("alert-coolantTemp")).toContainText("warning");
  await page
    .getByRole("button", {
      name: "Acknowledge Coolant temperature",
      exact: true,
    })
    .click();
  await expect(page.getByTestId("alert-coolantTemp")).toContainText(
    "Acknowledged",
  );
  await page.clock.runFor(17500);
  await expect(page.getByTestId("alert-coolantTemp")).toContainText("critical");
  await expect(
    page.getByRole("button", {
      name: "Acknowledge Coolant temperature",
      exact: true,
    }),
  ).toBeEnabled();
  await expect(page.getByTestId("event-history")).toContainText(
    "normal → warning",
  );
  await expect(page.getByTestId("event-history")).toContainText(
    "warning → critical",
  );
  await page.getByRole("button", { name: "Reset session" }).click();
  await expect(page.getByTestId("alert-coolantTemp")).toHaveCount(0);
  await expect(page.getByText("All monitored conditions normal")).toBeVisible();
});

test("communication loss freezes values, marks stale, and restores automatically", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button", { name: "Run Communication loss" }).click();
  await page.clock.runFor(4500);
  const fuel = await page.getByTestId("value-fuelLevel").innerText();
  const count = await page.getByTestId("sample-count").innerText();
  await page.clock.runFor(6500);
  await expect(page.getByTestId("delivery-status")).toHaveText(
    "Communication loss",
  );
  await expect(page.getByTestId("session-status")).toHaveText("DATA STALE");
  await expect(page.getByTestId("sample-count")).toHaveText(count);
  await expect(page.getByTestId("value-fuelLevel")).toHaveText(fuel);
  await expect(page.getByTestId("gauge-rpm")).toHaveAttribute(
    "aria-label",
    /Stale sample/,
  );
  await page.getByRole("button", { name: "Diagnostics", exact: true }).click();
  await expect(page.getByTestId("alert-communication")).toContainText(
    "No new sample",
  );
  await page.clock.runFor(6500);
  await expect(page.getByTestId("alert-communication")).toHaveCount(0);
  await expect(page.getByTestId("delivery-status")).toHaveText("Fresh samples");
  await expect(page.getByTestId("event-history")).toContainText(
    "Sample delivery resumed",
  );
  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  const curve = await page.locator(".recharts-area-curve").getAttribute("d");
  expect((curve?.match(/M/g) || []).length).toBeGreaterThanOrEqual(2);
});

test("settings validate thresholds and persist appearance, units, and visibility", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Day", exact: true }).click();
  await page.getByRole("button", { name: "Metric", exact: true }).click();
  await page.getByLabel("Fuel level", { exact: true }).uncheck();
  await page
    .getByLabel("Coolant temperature warning", { exact: true })
    .fill("250");
  await page
    .getByRole("button", { name: "Save Coolant temperature thresholds" })
    .click();
  await expect(
    page.getByText(
      "The critical threshold must be beyond the warning threshold.",
    ),
  ).toBeVisible();
  await page
    .getByLabel("Coolant temperature warning", { exact: true })
    .fill("225");
  await page
    .getByRole("button", { name: "Save Coolant temperature thresholds" })
    .click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "day");
  await expect(page.locator('[data-testid^="gauge-"]')).toHaveCount(5);
  await expect(page.getByTestId("gauge-coolantTemp")).toHaveAttribute(
    "aria-label",
    /°C/,
  );
  await expect(page.getByTestId("gauge-oilPressure")).toHaveAttribute(
    "aria-label",
    /kPa/,
  );
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(
    page.getByLabel("Coolant temperature warning", { exact: true }),
  ).toHaveValue("225");
});

test("CSV exports download with explicit simulation labeling", async ({
  page,
}) => {
  await page.goto("/");
  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Telemetry CSV", exact: true })
    .click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe("cobalt-simulated-telemetry.csv");
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  expect(Buffer.concat(chunks).toString()).toContain(
    "SIMULATED - NOT LIVE EQUIPMENT",
  );
});

test("desktop and mobile remain usable and produce authentic screenshots", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button", { name: "Run Normal operating ramp" }).click();
  await page.clock.runFor(28000);
  await page.getByRole("button", { name: "Pause simulation" }).click();
  await mkdir("docs/assets", { recursive: true });
  await page.screenshot({
    path: "docs/assets/dashboard-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("heading", { name: "Instrument dashboard" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: "docs/assets/dashboard-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "Diagnostics", exact: true }).click();
  await page.getByRole("button", { name: "Run Communication loss" }).click();
  await page.clock.runFor(11000);
  await expect(page.getByTestId("alert-communication")).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: "docs/assets/diagnostics-mobile.png",
    fullPage: true,
  });
});
