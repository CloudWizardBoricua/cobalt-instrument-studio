/**
 * Record source identity and hashes after the required validation has succeeded.
 * The workflow calls this after types, unit/privacy and both browser/build checks;
 * this function inventories files and labels execution context, but does not run
 * those checks itself. Local receipts remain explicitly local and publish nothing.
 */
import { writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { buildInventory, requiredChecks } from "./build-inventory.mjs";

/** Call only in the workflow step after type, unit, content and both browser checks pass. */
export function recordBuildVerification({
  root = process.cwd(),
  sourceCommit,
  executionContext = "local",
  output = "build-verification.json",
} = {}) {
  if (!/^[a-f0-9]{40}$/.test(sourceCommit || ""))
    throw new Error("A source commit is required.");
  // requiredChecks records the caller contract; it is not inferred from timestamps or output files.
  const files = buildInventory(root);
  const result = {
    schemaVersion: 1,
    sourceCommit,
    executionContext,
    checks: requiredChecks,
    files,
  };
  writeFileSync(resolve(root, output), `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

// CLI derives the source from CI or Git and preserves the local-vs-CI execution distinction.
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const sourceCommit =
    process.env.GITHUB_SHA ||
    execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const result = recordBuildVerification({
    sourceCommit,
    executionContext:
      process.env.GITHUB_ACTIONS === "true" ? "github-actions" : "local",
    output: process.argv[2] || "build-verification.json",
  });
  console.log(
    `Recorded ${result.files.length} file hashes (${result.executionContext}). This does not publish anything.`,
  );
}
