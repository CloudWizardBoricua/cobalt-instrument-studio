/**
 * Shared static-artifact inventory for recording, verification and release packaging.
 * Enumerate only regular files from both hosting outputs, then include versioned
 * release inputs and SHA-256 hashes. Links, hidden inputs and maps are rejected.
 * This binds demo bytes to evidence; it does not execute or certify any CI checks.
 */
import { lstatSync, readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

// Stable public attachment names and reviewed release inputs are shared across both hosts.
export const reportNames = [
  "Cobalt_Engineering_Report.pdf",
  "Cobalt_Engineering_Report.docx",
];
export const releaseInputNames = [
  "package.json",
  "CHANGELOG.md",
  "docs/RELEASE_NOTES.md",
  "docs/report-source.json",
];
export const requiredChecks = [
  "typecheck",
  "unit",
  "privacy",
  "browser",
  "static-hosting",
];
export const sha256 = (value) =>
  createHash("sha256").update(value).digest("hex");

/** Reject unexpected entries/links while producing a stable sorted regular-file inventory. */
export function staticFiles(root, directory) {
  if (lstatSync(join(root, directory)).isSymbolicLink())
    throw new Error(
      `Build artifact directory is a symbolic link: ${directory}`,
    );
  const files = [];
  for (const name of readdirSync(join(root, directory)).sort()) {
    const relative = `${directory}/${name}`;
    const info = lstatSync(join(root, relative));
    if (info.isSymbolicLink())
      throw new Error(`Build artifact contains a symbolic link: ${relative}`);
    if (
      (name.startsWith(".") && name !== ".nojekyll") ||
      name.endsWith(".map") ||
      name === "node_modules"
    )
      throw new Error(
        `Build artifact contains an unnecessary or hidden file: ${relative}`,
      );
    if (info.isDirectory()) files.push(...staticFiles(root, relative));
    else if (info.isFile()) files.push(relative);
    else
      throw new Error(`Build artifact contains a non-file entry: ${relative}`);
  }
  return files;
}

/** Hash the exact deployable bytes plus the metadata later consumed by release verification. */
export function buildInventory(root) {
  return [
    ...["dist", "dist-pages"].flatMap((directory) =>
      staticFiles(root, directory),
    ),
    ...releaseInputNames,
  ].map((name) => {
    const data = readFileSync(join(root, name));
    return { name, bytes: data.length, sha256: sha256(data) };
  });
}
