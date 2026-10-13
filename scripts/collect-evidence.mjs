import { readFile, writeFile, mkdir, readdir, stat } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";
import ts from "typescript";

await mkdir(".local/evidence-engine", { recursive: true });
for (const name of [
  "types",
  "model",
  "settings",
  "telemetry",
  "simulation",
  "diagnostics",
  "studio",
]) {
  const input = await readFile(`src/engine/${name}.ts`, "utf8");
  const output = ts.transpileModule(input, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  await writeFile(
    `.local/evidence-engine/${name}.js`,
    output.replace(/(from\s+['"]\.\/[^'"]+)(['"])/g, "$1.js$2"),
  );
}
const { createStudio, studioReducer } = await import(
  pathToFileURL(resolve(".local/evidence-engine/studio.js")).href
);
const { defaultSettings } = await import(
  pathToFileURL(resolve(".local/evidence-engine/settings.js")).href
);
const { scenarios: definitions } = await import(
  pathToFileURL(resolve(".local/evidence-engine/model.js")).href
);
const scenarios = [];
for (const { id, duration, faultDomain } of definitions) {
  let s = createStudio(defaultSettings, id);
  const observations = [];
  for (let i = 0; i < duration * 2; i++) {
    s = studioReducer(s, { type: "tick" });
    if (id === "oil-pressure-loss" || id === "invalid-sample-delivery") {
      observations.push({
        time: s.simulation.time,
        validAt: s.simulation.receivedAt,
        oilPressure: s.simulation.received.oilPressure,
        deliveryStatus: s.simulation.delivery.status,
        rejectedCount: s.simulation.delivery.rejectedCount,
        rejectionCodes: s.simulation.delivery.issues.map((issue) => issue.code),
        oilSeverity: s.diagnostics.alerts.oilPressure.severity,
        communicationSeverity: s.diagnostics.alerts.communication.severity,
      });
    }
  }
  scenarios.push({
    id,
    faultDomain,
    seed: s.simulation.seed,
    simulationSeconds: s.simulation.time,
    finalTelemetry: s.simulation.received,
    retainedSamples: s.history.length,
    delivery: s.simulation.delivery,
    observations,
    transitions: s.diagnostics.events
      .filter((e) => ["transition", "validation", "recovery"].includes(e.kind))
      .map((e) => ({
        time: e.time,
        kind: e.kind,
        severity: e.severity,
        message: e.message,
      })),
  });
}
const unit = JSON.parse(await readFile(".local/unit-results.json", "utf8"));
const e2e = JSON.parse(await readFile(".local/e2e-results.json", "utf8"));
const browser = JSON.parse(
  await readFile(".local/browser-measurements.json", "utf8"),
);
const browserCases = (suites) =>
  suites.flatMap((suite) => [
    ...(suite.specs || []).flatMap((spec) => spec.tests),
    ...browserCases(suite.suites || []),
  ]);
const cases = browserCases(e2e.suites);
// A filtered run cannot supply evidence for the full source suite.
const configuredBrowserCases =
  (await readFile("tests/e2e/studio.spec.ts", "utf8")).match(/^test\(/gm)
    ?.length || 0;
const configuredUnitFiles = (
  await readdir("tests", { recursive: true })
).filter((name) => /\.test\.(ts|tsx)$/.test(name)).length;
if (
  !unit.success ||
  unit.numFailedTests ||
  unit.numPendingTests ||
  unit.numPassedTests !== unit.numTotalTests ||
  unit.testResults.length !== configuredUnitFiles ||
  e2e.stats.unexpected ||
  e2e.stats.skipped ||
  e2e.stats.flaky ||
  e2e.stats.expected !== configuredBrowserCases ||
  cases.length !== configuredBrowserCases ||
  cases.some(
    (item) =>
      item.status !== "expected" || item.results.at(-1)?.status !== "passed",
  )
)
  throw new Error("Full passing test evidence is required.");
const bundles = [];
for (const name of await readdir("dist/assets")) {
  const bytes = await readFile(`dist/assets/${name}`);
  bundles.push({
    file: name,
    bytes: (await stat(`dist/assets/${name}`)).size,
    gzipBytes: gzipSync(bytes).length,
  });
}
const evidence = {
  version: "0.1.0",
  edition: "Local unreleased engineering hardening revision",
  validationDate: "Fall 2026",
  verification:
    "Local Windows engine and browser results for the unreleased hardening revision. Public hosting and release evidence files describe the earlier published baseline; no current hardening deployment was performed.",
  unit: {
    passed: unit.numPassedTests,
    failed: unit.numFailedTests,
    durationMs: unit.testResults.reduce(
      (n, r) => n + r.endTime - r.startTime,
      0,
    ),
  },
  browserTests: {
    passed: e2e.stats.expected,
    failed: e2e.stats.unexpected,
    durationMs: e2e.stats.duration,
    scenarioClock:
      "Virtual clock for guided paths; separate wall-clock start/pause smoke check.",
  },
  browser,
  accessibility: JSON.parse(
    await readFile(".local/accessibility-measurements.json", "utf8"),
  ),
  scenarios,
  bundles,
  limits: { modelStepMs: 500, historyCapacity: 240, eventCapacity: 100 },
  unmeasured: [
    "Heap memory",
    "Frame rate",
    "Long-duration browser soak",
    "Real hardware response",
    "Public hosting uptime",
  ],
};
await mkdir("docs", { recursive: true });
await writeFile(
  "docs/validation-evidence.json",
  JSON.stringify(evidence, null, 2),
);
console.log(
  JSON.stringify(
    {
      unit: evidence.unit,
      browserTests: evidence.browserTests,
      scenarios: evidence.scenarios.map((s) => ({
        id: s.id,
        transitions: s.transitions,
        final: s.finalTelemetry,
      })),
    },
    null,
    2,
  ),
);
