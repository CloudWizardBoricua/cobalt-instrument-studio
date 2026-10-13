import { expect, test } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

test("device navigation and engine inspection preserve the accepted sample and display properties", async ({
  page,
}) => {
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.goto("/");
  await page
    .getByRole("button", { name: "Start simulation", exact: true })
    .click();
  const workspace = page.getByTestId("device-workspace");
  await workspace.locator("summary").click();
  await workspace
    .getByRole("button", { name: "Expand device preview", exact: true })
    .click();
  const gauges = workspace.getByRole("tab", { name: "Gauges", exact: true });
  await gauges.focus();
  await gauges.press("ArrowRight");
  const engine = workspace.getByRole("tab", { name: "Engine", exact: true });
  await expect(engine).toBeFocused();
  await expect(engine).toHaveAttribute("aria-selected", "true");
  await workspace
    .locator(".device-preview")
    .screenshot({ path: "docs/assets/device-cockpit-engine.png" });
  await expect(
    workspace.getByTestId("device-engine-value-engineLoad"),
  ).toHaveText(await page.getByTestId("value-engineLoad").innerText());
  await workspace
    .getByRole("button", { name: /^Inspect Fuel level display properties/ })
    .click();
  await expect(
    workspace.getByLabel("Bound signal", { exact: true }),
  ).toHaveValue("fuelLevel");
  await workspace
    .getByLabel("Display label", { exact: true })
    .fill("Fuel reserve");
  await workspace
    .getByRole("button", { name: "Apply properties", exact: true })
    .click();
  await workspace
    .getByRole("button", { name: "Softkey: open Gauges page", exact: true })
    .click();
  await expect(workspace.getByTestId("device-slot-5")).toContainText(
    "Fuel reserve",
  );
  await workspace
    .locator(".device-preview")
    .screenshot({ path: "docs/assets/device-cockpit-gauges.png" });
  await expect(page.getByTestId("sample-count")).toHaveText("1 / 240");
  await gauges.press("End");
  await expect(
    workspace.getByRole("tab", { name: "ACK", exact: true }),
  ).toBeFocused();
  await expect(workspace.getByTestId("device-page-ack")).toContainText(
    "No alerts to review",
  );
  await workspace.getByRole("tab", { name: "ACK", exact: true }).press("Home");
  await expect(gauges).toBeFocused();
});

test("device ACK shares acknowledgment, escalation and clearing with central diagnostics", async ({
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
  const workspace = page.getByTestId("device-workspace");
  await workspace.locator("summary").click();
  await workspace
    .getByRole("button", { name: "Expand device preview", exact: true })
    .click();
  await workspace.getByRole("tab", { name: "Faults", exact: true }).click();
  await expect(workspace.getByTestId("device-fault-oilPressure")).toContainText(
    "warning",
  );
  await workspace
    .locator(".device-preview")
    .screenshot({ path: "docs/assets/device-cockpit-faults.png" });
  await workspace
    .getByRole("button", {
      name: "Softkey: open alert review page",
      exact: true,
    })
    .click();
  const review = workspace.getByRole("button", {
    name: "Review Oil pressure in device preview",
    exact: true,
  });
  await workspace
    .locator(".device-preview")
    .screenshot({ path: "docs/assets/device-cockpit-ack.png" });
  await review.click();
  await expect(review).toBeDisabled();
  await page.getByRole("button", { name: "Diagnostics", exact: true }).click();
  await expect(page.getByTestId("alert-oilPressure")).toContainText(
    "Acknowledged",
  );
  await page.clock.runFor(11000);
  await expect(page.getByTestId("alert-oilPressure")).toContainText("critical");
  await expect(review).toBeEnabled();
  await review.click();
  await expect(page.getByTestId("alert-oilPressure")).toContainText(
    "Acknowledged",
  );
  await page.clock.runFor(19000);
  await expect(review).toHaveCount(0);
  await workspace.getByRole("tab", { name: "Faults", exact: true }).click();
  await expect(workspace.getByTestId("device-fault-oilPressure")).toHaveCount(
    0,
  );
  await expect(workspace.getByTestId("device-page-faults")).toContainText(
    "warning → normal",
  );
});

test("three device trends retain accepted history through invalid deliveries and resume on recovery", async ({
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
  const count = await page.getByTestId("sample-count").innerText();
  const workspace = page.getByTestId("device-workspace");
  await workspace.locator("summary").click();
  await workspace
    .getByRole("button", { name: "Expand device preview", exact: true })
    .click();
  await workspace.getByRole("tab", { name: "Trends", exact: true }).click();
  await expect(workspace.locator(".device-trend-row")).toHaveCount(3);
  const acceptedReadings = await workspace
    .locator(".device-trend-reading .mono")
    .allTextContents();
  await page.clock.runFor(10500);
  await expect(page.getByTestId("sample-count")).toHaveText(count);
  await expect(workspace.getByTestId("device-preview-status")).toContainText(
    "stale accepted sample",
  );
  expect(
    await workspace.locator(".device-trend-reading .mono").allTextContents(),
  ).toEqual(acceptedReadings);
  await expect(workspace.getByTestId("device-page-trends")).toContainText(
    `${parseInt(count)} accepted samples`,
  );
  await page.clock.runFor(2000);
  await expect(page.getByTestId("validation-status")).toHaveText(
    "Delivery recovered",
  );
  await expect(page.getByTestId("sample-count")).not.toHaveText(count);
  await workspace
    .locator(".device-preview")
    .screenshot({ path: "docs/assets/device-cockpit-trends.png" });
});

test("all five device pages fit desktop and narrow screens in both themes", async ({
  page,
}) => {
  await page.goto("/");
  const workspace = page.getByTestId("device-workspace");
  await workspace.locator("summary").click();
  await workspace
    .getByRole("button", { name: "Expand device preview", exact: true })
    .click();
  const results = [];
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const theme of ["night", "day"]) {
    if (theme === "day")
      await page
        .getByRole("button", { name: "Switch to day mode", exact: true })
        .click();
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const name of ["Gauges", "Engine", "Trends", "Faults", "ACK"]) {
        await workspace.getByRole("tab", { name, exact: true }).click();
        const scrollWidth = await page.evaluate(
          () => document.documentElement.scrollWidth,
        );
        expect(scrollWidth).toBeLessThanOrEqual(width);
        await expect(
          workspace.getByRole("tabpanel", { name, exact: true }),
        ).toBeVisible();
        if (name === "Gauges" || name === "Engine") {
          const readout = workspace.getByTestId(
            name === "Engine" ? "device-engine-value-1" : "device-value-1",
          );
          const fontSize = await readout.evaluate((element) =>
            Number.parseFloat(getComputedStyle(element).fontSize),
          );
          expect(fontSize).toBeGreaterThanOrEqual(44);
        }
        results.push({ theme, width, page: name, scrollWidth });
        if (theme === "night" && width === 390 && name === "Engine") {
          await workspace
            .getByRole("heading", { name: "Device preview", exact: true })
            .click();
          await workspace
            .locator(".device-preview")
            .screenshot({ path: "docs/assets/device-cockpit-mobile.png" });
        }
      }
    }
  }
  expect(errors).toEqual([]);
  await mkdir(".local", { recursive: true });
  await writeFile(
    ".local/device-page-layout-results.json",
    JSON.stringify(
      { date: "Fall 2026", results, javascriptErrors: errors },
      null,
      2,
    ),
  );
});

test("all instrument displays stay at zero until start, hold on pause and return to zero on reset", async ({
  page,
}) => {
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.goto("/");
  const metrics = [
    "rpm",
    "engineLoad",
    "coolantTemp",
    "oilPressure",
    "fuelLevel",
    "batteryVoltage",
  ];
  for (const metric of metrics)
    await expect(page.getByTestId(`value-${metric}`)).toHaveText("0");
  await expect(page.getByTestId("session-status")).toHaveText("READY TO START");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Metric", exact: true }).click();
  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  await expect(page.getByTestId("value-coolantTemp")).toHaveText("0");
  const workspace = page.getByTestId("device-workspace");
  await workspace.locator("summary").click();
  for (let slot = 1; slot <= 6; slot++)
    await expect(workspace.getByTestId(`device-value-${slot}`)).toHaveText("0");
  await expect(workspace.getByTestId("device-preview-status")).toContainText(
    "Standby",
  );
  await workspace.getByRole("tab", { name: "Engine", exact: true }).click();
  await expect(workspace.getByTestId("device-engine-value-1")).toHaveText("0");
  for (const metric of metrics.slice(1))
    await expect(
      workspace.getByTestId(`device-engine-value-${metric}`),
    ).toHaveText("0");
  await workspace.getByRole("tab", { name: "Trends", exact: true }).click();
  expect(
    await workspace.locator(".device-trend-reading .mono").allTextContents(),
  ).toEqual(["0 rpm", "0 °C", "0 kPa"]);
  await page
    .getByRole("button", { name: "Start simulation", exact: true })
    .click();
  await expect(page.getByTestId("value-rpm")).not.toHaveText("0");
  const started = await Promise.all(
    metrics.map((metric) => page.getByTestId(`value-${metric}`).innerText()),
  );
  await page
    .getByRole("button", { name: "Pause simulation", exact: true })
    .click();
  await expect(page.getByTestId("session-status")).toHaveText(
    "SIMULATION PAUSED",
  );
  await page.clock.runFor(5000);
  expect(
    await Promise.all(
      metrics.map((metric) => page.getByTestId(`value-${metric}`).innerText()),
    ),
  ).toEqual(started);
  await page
    .getByRole("button", { name: "Reset session", exact: true })
    .click();
  for (const metric of metrics)
    await expect(page.getByTestId(`value-${metric}`)).toHaveText("0");
  await page
    .getByLabel("Scenario", { exact: true })
    .selectOption("normal-ramp");
  await page.getByRole("button", { name: "Run scenario", exact: true }).click();
  await expect(page.getByTestId("value-rpm")).not.toHaveText("0");
  await workspace.getByRole("tab", { name: "Gauges", exact: true }).click();
  await expect(workspace.getByTestId("device-value-1")).toHaveText(
    await page.getByTestId("value-rpm").innerText(),
  );
});
