import { expect, test } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

test("invalid delivery preserves all accepted readings, ages them, and recovers", async ({
  page,
}) => {
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.goto("/");
  await page
    .getByLabel("Scenario", { exact: true })
    .selectOption("invalid-sample-delivery");
  await page.getByRole("button", { name: "Run scenario", exact: true }).click();
  await page.clock.runFor(4500);
  const metrics = [
    "rpm",
    "oilPressure",
    "coolantTemp",
    "batteryVoltage",
    "fuelLevel",
    "engineLoad",
  ];
  const retained = await Promise.all(
    metrics.map((m) => page.getByTestId(`value-${m}`).innerText()),
  );
  const history = await page.getByTestId("sample-count").innerText();
  await page.clock.runFor(500);
  await expect(page.getByTestId("validation-status")).toHaveText(
    "Sample rejected",
  );
  await expect(page.getByTestId("session-status")).toHaveText(
    "SAMPLE REJECTED",
  );
  await page.getByTestId("device-workspace").locator("summary").click();
  await expect(page.getByTestId("device-preview-status")).toContainText(
    "last valid readings retained",
  );
  await expect(page.getByTestId("rejection-reasons")).not.toBeEmpty();
  await page.clock.runFor(6000);
  await expect(page.getByTestId("session-status")).toHaveText("DATA STALE");
  await expect(page.getByTestId("sample-count")).toHaveText(history);
  await expect(page.getByTestId("last-valid-time")).toHaveText("00:04");
  expect(
    await Promise.all(
      metrics.map((m) => page.getByTestId(`value-${m}`).innerText()),
    ),
  ).toEqual(retained);
  for (let i = 0; i < metrics.length; i++)
    await expect(page.getByTestId(`device-value-${i + 1}`)).toHaveText(
      retained[i],
    );
  await expect(page.getByTestId("device-preview-status")).toContainText(
    "stale accepted sample",
  );
  await mkdir("docs/assets", { recursive: true });
  await page
    .locator(".validation-panel")
    .screenshot({ path: "docs/assets/rejected-sample-desktop.png" });
  await page.getByRole("button", { name: "Diagnostics", exact: true }).click();
  await expect(page.getByTestId("alert-communication")).toBeVisible();
  await page.clock.runFor(2000);
  await expect(page.getByTestId("rejection-reasons")).toContainText(
    "duplicate",
  );
  await page.clock.runFor(2000);
  await expect(page.getByTestId("rejection-reasons")).toContainText(
    "out-of-order",
  );
  await page.clock.runFor(2000);
  await expect(page.getByTestId("validation-status")).toHaveText(
    "Delivery recovered",
  );
  await expect(page.getByTestId("alert-communication")).toHaveCount(0);
  await expect(page.getByTestId("delivery-recovery-time")).toHaveText("00:17");
  await expect(page.getByTestId("event-history")).toContainText("rejected");
  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  await expect(page.getByTestId("last-valid-time")).toHaveText("00:17");
  await expect(page.getByTestId("accepted-count")).toHaveText("11");
  await expect(page.getByTestId("rejected-count")).toHaveText("24");
  expect(
    await Promise.all(
      metrics.map((m) => page.getByTestId(`value-${m}`).innerText()),
    ),
  ).not.toEqual(retained);
  await expect(page.getByTestId("gauge-rpm")).not.toHaveAttribute(
    "aria-label",
    /Stale sample/,
  );
});

test("oil pressure loss escalates after acknowledgment and clears on recovery", async ({
  page,
}) => {
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.goto("/");
  await page
    .getByLabel("Scenario", { exact: true })
    .selectOption("oil-pressure-loss");
  await page.getByRole("button", { name: "Run scenario", exact: true }).click();
  await page.clock.runFor(12000);
  await page.getByRole("button", { name: "Diagnostics", exact: true }).click();
  await expect(page.getByTestId("alert-oilPressure")).toContainText("warning");
  await page
    .getByRole("button", { name: "Acknowledge Oil pressure", exact: true })
    .click();
  await expect(page.getByTestId("alert-oilPressure")).toContainText(
    "Acknowledged",
  );
  await page.clock.runFor(11000);
  await expect(page.getByTestId("alert-oilPressure")).toContainText("critical");
  await expect(
    page.getByRole("button", { name: "Acknowledge Oil pressure", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Acknowledge Oil pressure", exact: true })
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("heading", { name: "System diagnostics", exact: true })
    .click();
  await page.screenshot({
    path: "docs/assets/oil-pressure-mobile.png",
    fullPage: true,
  });
  await page.clock.runFor(19000);
  await expect(page.getByTestId("alert-oilPressure")).toHaveCount(0);
  await expect(page.getByTestId("event-history")).toContainText(
    "critical → warning",
  );
  await expect(page.getByTestId("event-history")).toContainText(
    "warning → normal",
  );
  await expect(page.getByTestId("rejected-count")).toHaveText("0");
});

test("device properties apply atomically, retain across views, and preserve the engine", async ({
  page,
}) => {
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.goto("/");
  await page
    .getByLabel("Scenario", { exact: true })
    .selectOption("normal-ramp");
  await page.getByRole("button", { name: "Run scenario", exact: true }).click();
  await page.clock.runFor(28000);
  await page.getByRole("button", { name: "Pause simulation" }).click();
  const rpm = await page.getByTestId("value-rpm").innerText();
  const history = await page.getByTestId("sample-count").innerText();
  const workspace = page.getByTestId("device-workspace");
  await workspace.locator("summary").click();
  await page
    .getByRole("button", {
      name: "Bind Oil pressure to selected slot",
      exact: true,
    })
    .click();
  await page.getByLabel("Display label", { exact: true }).fill("Lube pressure");
  await page.getByLabel("Scale maximum (psi)", { exact: true }).fill("-1");
  await page
    .getByRole("button", { name: "Apply properties", exact: true })
    .click();
  await expect(page.getByTestId("device-slot-1")).toContainText("Engine speed");
  await expect(
    page.getByLabel("Scale maximum (psi)", { exact: true }),
  ).toHaveAttribute("aria-invalid", "true");
  await page.getByLabel("Scale maximum (psi)", { exact: true }).fill("90");
  await page
    .getByRole("button", { name: "Apply properties", exact: true })
    .click();
  await expect(page.getByTestId("device-slot-1")).toContainText(
    "Lube pressure",
  );
  await expect(page.getByTestId("device-value-1")).toHaveText(
    await page.getByTestId("value-oilPressure").innerText(),
  );
  await expect(page.getByTestId("value-rpm")).toHaveText(rpm);
  await expect(page.getByTestId("sample-count")).toHaveText(history);
  await expect(page.getByTestId("diagnostic-status")).toHaveText("Normal");
  await workspace.screenshot({ path: "docs/assets/workspace-desktop.png" });
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByTestId("device-slot-1")).toContainText(
    "Lube pressure",
  );
  await page.getByRole("button", { name: "Metric", exact: true }).click();
  await expect(page.getByTestId("device-slot-1")).toHaveAttribute(
    "aria-label",
    /kPa/,
  );
  await expect(
    page.getByLabel("Scale maximum (psi)", { exact: true }),
  ).toHaveValue("90");
  await page
    .getByRole("button", { name: "Reset slot 1 properties", exact: true })
    .click();
  await expect(page.getByTestId("device-slot-1")).toContainText("Engine speed");
  await page.reload();
  await workspace.locator("summary").click();
  await expect(page.getByTestId("device-slot-1")).toContainText("Engine speed");
});

test("all views support keyboard focus, day/night contrast, mobile, and stable announcements", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to main content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  const results: unknown[] = [];
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1100 : 844 });
    for (const theme of ["day", "night"]) {
      const toggle = page.getByRole("button", {
        name: `Switch to ${theme} mode`,
      });
      if (await toggle.count()) await toggle.click();
      for (const view of ["Dashboard", "Diagnostics", "Settings"]) {
        await page.getByRole("button", { name: view, exact: true }).click();
        await expect(
          page.getByRole("link", { name: "Cobalt project source on GitHub" }),
        ).toBeVisible();
        const summary = page.getByTestId("device-workspace").locator("summary");
        if (
          !(await page.getByTestId("device-workspace").getAttribute("open"))
        ) {
          // The empty string means the boolean attribute is present; check DOM property.
          if (
            !(await page
              .getByTestId("device-workspace")
              .evaluate((el) => (el as HTMLDetailsElement).open))
          )
            await summary.click();
        }
        await summary.focus();
        if (width <= 390) {
          const signals = await page.locator(".device-signals").boundingBox();
          const preview = await page.locator(".device-preview").boundingBox();
          const properties = await page
            .locator(".device-properties")
            .boundingBox();
          expect(signals!.y).toBeLessThan(preview!.y);
          expect(preview!.y).toBeLessThan(properties!.y);
        }
        await page.keyboard.press("Tab");
        await expect(
          page.getByRole("button", {
            name: "Bind Engine speed to selected slot",
            exact: true,
          }),
        ).toBeFocused();
        const measured = await page.evaluate(() => {
          const style = getComputedStyle(document.documentElement);
          const rgb = (color: string) =>
            (color.trim().startsWith("#")
              ? color
                  .trim()
                  .replace("#", "")
                  .match(/../g)!
                  .map((part) => parseInt(part, 16))
              : color
                  .match(/[\d.]+/g)!
                  .slice(0, 3)
                  .map(Number)
            )
              .map((part) => part / 255)
              .map((n) =>
                n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4,
              );
          const luminance = (hex: string) =>
            rgb(hex).reduce(
              (v, n, i) => v + n * [0.2126, 0.7152, 0.0722][i],
              0,
            );
          const contrast = (a: string, b: string) => {
            const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
            return (values[0] + 0.05) / (values[1] + 0.05);
          };
          const focused = getComputedStyle(document.activeElement!);
          const actualControls = Array.from(
            document.querySelectorAll(
              ".nav-item.active, .segmented button.selected",
            ),
          ).map((el) => {
            const computed = getComputedStyle(el);
            return {
              text: el.textContent,
              ratio: contrast(computed.color, computed.backgroundColor),
            };
          });
          return {
            scrollWidth: document.documentElement.scrollWidth,
            actualControls,
            focusStyle: focused.outlineStyle,
            focusWidth: parseFloat(focused.outlineWidth),
            transitionSeconds: parseFloat(
              getComputedStyle(document.querySelector(".device-preview-slot")!)
                .transitionDuration,
            ),
            contrast: Object.fromEntries(
              [
                "--text",
                "--muted",
                "--accent",
                "--normal",
                "--warning",
                "--critical",
              ].map((name) => [
                name,
                contrast(
                  style.getPropertyValue(name),
                  style.getPropertyValue("--panel"),
                ),
              ]),
            ),
          };
        });
        expect(measured.scrollWidth).toBeLessThanOrEqual(width);
        expect(measured.focusStyle).toBe("solid");
        expect(measured.focusWidth).toBeGreaterThanOrEqual(3);
        expect(measured.transitionSeconds).toBeLessThanOrEqual(0.001);
        for (const ratio of Object.values(measured.contrast))
          expect(ratio).toBeGreaterThanOrEqual(4.5);
        for (const control of measured.actualControls)
          expect(control.ratio).toBeGreaterThanOrEqual(4.5);
        results.push({ width, theme, view, ...measured });
      }
    }
  }
  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  await page
    .getByRole("button", { name: "Start simulation", exact: true })
    .click();
  const announcement = await page.getByTestId("state-announcement").innerText();
  await page.clock.runFor(2000);
  await expect(page.getByTestId("state-announcement")).toHaveText(announcement);
  await page.getByRole("button", { name: "Pause simulation" }).click();
  await expect(page.getByTestId("state-announcement")).toContainText(
    "Simulation paused",
  );
  await writeFile(
    ".local/accessibility-measurements.json",
    JSON.stringify(
      {
        checks: results,
        scope:
          "Computed palette contrast, visible focus, width, reduced motion, and stable live-region content; no assistive-device certification.",
      },
      null,
      2,
    ),
  );
});

test("device workspace supports keyboard selection, property submission, and reset", async ({
  page,
}) => {
  await page.goto("/");
  const workspace = page.getByTestId("device-workspace");
  await workspace.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(workspace).toHaveAttribute("open", "");
  await page.getByTestId("device-slot-3").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("device-slot-3")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page
    .getByRole("button", {
      name: "Bind Engine speed to selected slot",
      exact: true,
    })
    .focus();
  await page.keyboard.press("Enter");
  await page.getByLabel("Display label", { exact: true }).focus();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("Device speed");
  await page.getByLabel("Scale maximum (rpm)", { exact: true }).focus();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("3000");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("device-slot-3")).toContainText("Device speed");
  await expect(page.getByTestId("device-slot-3")).toHaveAttribute(
    "aria-label",
    /Device speed/,
  );
  await page
    .getByRole("button", { name: "Reset slot 3 properties", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("device-slot-3")).toContainText(
    "Coolant temperature",
  );
});

test("desktop controls update real telemetry, pause, and reset", async ({
  page,
  browser,
}, testInfo) => {
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
        browser: browser.browserType().name(),
        browserVersion: browser.version(),
        browserChannel: testInfo.project.use.channel || null,
        browserPlatform: process.platform,
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
  await page.clock.pauseAt(new Date());
  await page.goto("/");
  await page.getByLabel("Scenario", { exact: true }).selectOption("overheat");
  await expect(page.getByTestId("scenario-description")).toContainText(
    "Follow a thermal fault",
  );
  await page.clock.runFor(1000);
  await expect(page.getByTestId("simulation-time")).toHaveText("00:00");
  await expect(page.getByTestId("session-status")).toHaveText("READY TO START");
  await expect(page.getByTestId("scenario-explainer")).toHaveCount(0);
  await page
    .getByLabel("Scenario", { exact: true })
    .selectOption("normal-ramp");
  await page.getByRole("button", { name: "Run scenario", exact: true }).click();
  await page.clock.runFor(5000);
  await page.getByLabel("Scenario", { exact: true }).selectOption("overheat");
  await expect(page.getByTestId("simulation-time")).toHaveText("00:05");
  await expect(page.getByTestId("scenario-explainer")).toContainText(
    "Normal operating ramp",
  );
  await expect(page.getByTestId("scenario-explainer")).toContainText(
    "Ramps from idle to normal operation",
  );
  await page.clock.runFor(30000);
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
  await expect(page.getByTestId("scenario-explainer")).toContainText(
    "Normal operating ramp",
  );
  await page.getByLabel("Scenario", { exact: true }).selectOption("overheat");
  await page.getByRole("button", { name: "Run scenario", exact: true }).click();
  await expect(page.getByTestId("scenario-explainer")).toContainText(
    "Coolant overheat",
  );
  await expect(page.getByTestId("simulation-time")).toHaveText("00:00");
});

test("overheat warning escalates, acknowledgment records review, reset resolves", async ({
  page,
}) => {
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.goto("/");
  await page.getByLabel("Scenario", { exact: true }).selectOption("overheat");
  await page.getByRole("button", { name: "Run scenario", exact: true }).click();
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
  await page.clock.pauseAt(new Date());
  await page.goto("/");
  await page
    .getByLabel("Scenario", { exact: true })
    .selectOption("communication-loss");
  await page.getByRole("button", { name: "Run scenario", exact: true }).click();
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
    "No valid sample",
  );
  await page.clock.runFor(6500);
  await expect(page.getByTestId("alert-communication")).toHaveCount(0);
  await expect(page.getByTestId("delivery-status")).toHaveText("Fresh samples");
  await expect(page.getByTestId("event-history")).toContainText(
    "Fresh valid sample delivery resumed",
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
  await page.clock.pauseAt(new Date());
  await page.goto("/");
  await page
    .getByLabel("Scenario", { exact: true })
    .selectOption("normal-ramp");
  await page.getByRole("button", { name: "Run scenario", exact: true }).click();
  await page.clock.runFor(28000);
  await page.getByRole("button", { name: "Pause simulation" }).click();
  await mkdir("docs/assets", { recursive: true });
  await page
    .getByRole("heading", { name: "Instrument dashboard", exact: true })
    .click();
  await page.screenshot({
    path: "docs/assets/dashboard-desktop.png",
    fullPage: false,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("heading", { name: "Instrument dashboard" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.locator(".app-shell").screenshot({
    path: "docs/assets/dashboard-mobile.png",
  });
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "Diagnostics", exact: true }).click();
  await page
    .getByLabel("Scenario", { exact: true })
    .selectOption("communication-loss");
  await page.getByRole("button", { name: "Run scenario", exact: true }).click();
  await page.clock.runFor(11000);
  await expect(page.getByTestId("alert-communication")).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page
    .getByRole("heading", { name: "System diagnostics", exact: true })
    .click();
  await page.locator(".app-shell").screenshot({
    path: "docs/assets/diagnostics-mobile.png",
  });
});
