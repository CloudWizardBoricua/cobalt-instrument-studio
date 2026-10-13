import { lstatSync, readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

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
