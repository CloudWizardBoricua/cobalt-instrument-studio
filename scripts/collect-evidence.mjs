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
const scenarios = [];
for (const id of ["normal-ramp", "overheat", "communication-loss"]) {
  let s = createStudio(defaultSettings, id);
  for (let i = 0; i < 70; i++) s = studioReducer(s, { type: "tick" });
  scenarios.push({
    id,
    seed: s.simulation.seed,
    simulationSeconds: s.simulation.time,
    finalTelemetry: s.simulation.received,
    retainedSamples: s.history.length,
    transitions: s.diagnostics.events
      .filter((e) => e.kind === "transition")
      .map((e) => ({ time: e.time, severity: e.severity, message: e.message })),
  });
}
const unit = JSON.parse(await readFile(".local/unit-results.json", "utf8"));
const e2e = JSON.parse(await readFile(".local/e2e-results.json", "utf8"));
const browser = JSON.parse(
  await readFile(".local/browser-measurements.json", "utf8"),
);
if (
  unit.numFailedTests ||
  e2e.stats.unexpected ||
  unit.numPassedTests !== 32 ||
  e2e.stats.expected !== 7
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
  validationDate: "Fall 2026",
  verification:
    "Local Windows engine and browser results. Remote CI is recorded separately in README.md; public hosting checks are recorded in public-http-validation.json and public-browser-validation.json.",
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
