import { createServer } from "node:http";
import { readFile, writeFile, mkdir, stat, readdir } from "node:fs/promises";
import { resolve, extname, sep, dirname } from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { performance } from "node:perf_hooks";
import { chromium, expect } from "@playwright/test";
import { gzipSync } from "node:zlib";

const results = [];
const skipBuild = process.argv.includes("--skip-build");
for (const [name, command] of [
  ["root", "build"],
  ["project", "build:pages"],
]) {
  const start = performance.now();
  const executable = process.platform === "win32" ? process.execPath : "npm";
  const args =
    process.platform === "win32"
      ? [
          resolve(dirname(process.execPath), "node_modules/npm/bin/npm-cli.js"),
          "run",
          command,
        ]
      : ["run", command];
  if (!skipBuild) {
    const run = spawnSync(executable, args, { stdio: "inherit" });
    if (run.status !== 0) throw new Error(`${name} production build failed.`);
  }
  results.push({
    name,
    buildCommand: `npm run ${command}`,
    buildWallMs: skipBuild ? null : Math.round(performance.now() - start),
    buildExecution: skipBuild
      ? "Previously built; this command verifies existing output."
      : "Built by this command.",
    browser: "pending",
    downloads: [],
  });
}
const browser = await chromium.launch({
  channel: process.env.CI
    ? undefined
    : process.env.PW_BROWSER_CHANNEL || "msedge",
});
const mime = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".pdf": "application/pdf",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};
try {
  for (const [index, output, base] of [
    [0, "dist", "/"],
    [1, "dist-pages", "/cobalt-instrument-studio/"],
  ]) {
    const root = resolve(output);
    const server = createServer(async (request, response) => {
      try {
        const pathname = decodeURIComponent(
          new URL(request.url, "http://127.0.0.1").pathname,
        );
        if (!pathname.startsWith(base)) {
          response.writeHead(404).end();
          return;
        }
        const relative = pathname.slice(base.length) || "index.html";
        const path = resolve(root, relative);
        if (!path.startsWith(root + sep)) {
          response.writeHead(403).end();
          return;
        }
        const bytes = await readFile(path);
        response
          .writeHead(200, {
            "Content-Type": mime[extname(path)] || "application/octet-stream",
          })
          .end(bytes);
      } catch {
        response.writeHead(404).end();
      }
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    const origin = `http://127.0.0.1:${address.port}`;
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [],
      badResponses = [],
      externalRequests = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400)
        badResponses.push({
          path: new URL(response.url()).pathname,
          status: response.status(),
        });
    });
    page.on("request", (request) => {
      if (
        !request.url().startsWith(origin) &&
        !request.url().startsWith("blob:") &&
        !request.url().startsWith("data:")
      )
        externalRequests.push(request.url());
    });
    try {
      await page.clock.install();
      await page.clock.pauseAt(new Date());
      await page.goto(origin + base);
      if ((await page.locator('[data-testid^="gauge-"]').count()) !== 6)
        throw new Error("Six instruments did not render.");
      for (const extension of ["pdf", "docx"]) {
        const file = `Cobalt_Engineering_Report.${extension}`;
        const path = `${base}reports/${file}`;
        const link = page.getByRole("link", {
          name: extension === "pdf" ? "PDF" : "Editable DOCX",
          exact: true,
        });
        if ((await link.getAttribute("href")) !== path)
          throw new Error("Report link has an incorrect base path.");
        const response = await context.request.get(origin + path);
        const bytes = await response.body();
        const expected = await readFile(`docs/${file}`);
        if (
          response.status() !== 200 ||
          bytes.length < 10000 ||
          !bytes.equals(expected)
        )
          throw new Error("Report download did not match its source artifact.");
        results[index].downloads.push({
          extension,
          status: response.status(),
          bytes: bytes.length,
          sha256: createHash("sha256").update(bytes).digest("hex"),
        });
      }
      await page
        .getByLabel("Scenario", { exact: true })
        .selectOption("overheat");
      await page
        .getByRole("button", { name: "Run scenario", exact: true })
        .click();
      await page.clock.runFor(35000);
      await page
        .getByRole("button", { name: "Diagnostics", exact: true })
        .click();
      await expect(page.getByTestId("alert-coolantTemp")).toContainText(
        "critical",
      );
      await page
        .getByLabel("Scenario", { exact: true })
        .selectOption("communication-loss");
      await page
        .getByRole("button", { name: "Run scenario", exact: true })
        .click();
      await page.clock.runFor(11000);
      if (
        !(await page.getByTestId("delivery-status").innerText()).includes(
          "Communication loss",
        )
      )
        throw new Error("Production timeout failed.");
      await page.clock.runFor(6500);
      if (
        (await page.getByTestId("delivery-status").innerText()) !==
        "Fresh samples"
      )
        throw new Error("Production recovery failed.");
      await page
        .getByRole("button", { name: "Dashboard", exact: true })
        .click();
      await page
        .getByLabel("Scenario", { exact: true })
        .selectOption("invalid-sample-delivery");
      await page
        .getByRole("button", { name: "Run scenario", exact: true })
        .click();
      await page.clock.runFor(4500);
      const retainedRPM = await page.getByTestId("value-rpm").innerText();
      const retainedHistory = await page
        .getByTestId("sample-count")
        .innerText();
      await page.clock.runFor(10500);
      await expect(page.getByTestId("validation-status")).toHaveText(
        "Sample rejected",
      );
      await expect(page.getByTestId("value-rpm")).toHaveText(retainedRPM);
      await expect(page.getByTestId("sample-count")).toHaveText(
        retainedHistory,
      );
      await expect(page.getByTestId("session-status")).toHaveText("DATA STALE");
      await page.clock.runFor(2000);
      await expect(page.getByTestId("validation-status")).toHaveText(
        "Delivery recovered",
      );
      await expect(page.getByTestId("rejected-count")).toHaveText("24");
      await page
        .getByLabel("Scenario", { exact: true })
        .selectOption("oil-pressure-loss");
      await page
        .getByRole("button", { name: "Run scenario", exact: true })
        .click();
      await page.clock.runFor(20000);
      await expect(page.getByTestId("gauge-oilPressure")).toHaveAttribute(
        "aria-label",
        /critical condition/,
      );
      await page.clock.runFor(8000);
      await expect(page.getByTestId("gauge-oilPressure")).toHaveAttribute(
        "aria-label",
        /normal condition/,
      );
      const workspace = page.getByTestId("device-workspace");
      await expect(workspace).toHaveAttribute("open", "");
      await page
        .getByLabel("Display label", { exact: true })
        .fill("Production preview");
      await page
        .getByRole("button", { name: "Apply properties", exact: true })
        .click();
      await expect(page.getByTestId("device-slot-1")).toContainText(
        "Production preview",
      );
      await expect(
        page.getByRole("link", { name: "Cobalt project source on GitHub" }),
      ).toHaveAttribute(
        "href",
        "https://github.com/CloudWizardBoricua/cobalt-instrument-studio",
      );
      await page
        .getByLabel("Scenario", { exact: true })
        .selectOption("normal-ramp");
      await page
        .getByRole("button", { name: "Run scenario", exact: true })
        .click();
      await page.clock.runFor(125000);
      if (
        (await page.getByTestId("sample-count").innerText()).replace(
          /\s/g,
          "",
        ) !== "240/240"
      )
        throw new Error("Production history cap failed.");
      await page.setViewportSize({ width: 390, height: 844 });
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(390);
      await page.reload();
      if ((await page.locator('[data-testid^="gauge-"]').count()) !== 6)
        throw new Error("Production refresh failed.");
      if (errors.length || badResponses.length || externalRequests.length)
        throw new Error(
          JSON.stringify({ errors, badResponses, externalRequests }),
        );
      results[index].browser = "pass";
      results[index].checks = [
        "six instruments",
        "overheat critical",
        "communication timeout and recovery",
        "invalid delivery retention and recovery",
        "oil pressure escalation and recovery",
        "device property application",
        "adjacent developer source link",
        "bounded 240 samples",
        "mobile width",
        "refresh",
        "base-aware reports",
        "no external runtime requests",
      ];
      results[index].javascriptErrors = errors;
    } finally {
      await context.close();
      await new Promise((resolve) => server.close(resolve));
    }
  }
} finally {
  await browser.close();
}
const bundles = [];
for (const name of await readdir("dist/assets")) {
  const bytes = await readFile(`dist/assets/${name}`);
  bundles.push({
    file: name,
    bytes: (await stat(`dist/assets/${name}`)).size,
    gzipBytes: gzipSync(bytes).length,
  });
}
await mkdir("docs", { recursive: true });
await writeFile(
  "docs/hosting-build-validation.json",
  JSON.stringify(
    {
      date: "Fall 2026",
      verification:
        "Local static production-build verification. Public HTTP and browser verification are recorded separately in public-http-validation.json and public-browser-validation.json.",
      results,
      bundles,
    },
    null,
    2,
  ),
);
console.log(JSON.stringify(results, null, 2));
