/**
 * Package the exact verified static builds into a reviewable release bundle.
 * Version checks, source/hash inventories, equal report copies and archive round-trip
 * precede manifest/checksum creation. Publication is handled by a separate script.
 * tar must be available; a local package is inspection evidence, not proof of hosted
 * deployment or CI execution. No simulator control or hardware transport runs here.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { basename, join, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { verifyRelease } from "./verify-release.mjs";
import {
  reportNames,
  sha256,
  staticFiles,
  requiredChecks,
} from "./build-inventory.mjs";
import { verifyBuildVerification } from "./verify-build-verification.mjs";
export { reportNames, sha256 } from "./build-inventory.mjs";

/** Package only the builds and documentation from the successful CI artifact. */
export function packageRelease({
  artifactRoot,
  outputDirectory,
  tag,
  expectedCommit,
}) {
  // Keep output outside the trusted input tree and bind it to a full source commit.
  const root = resolve(artifactRoot);
  const output = resolve(outputDirectory);
  if (output === root || output.startsWith(`${root}${sep}`))
    throw new Error("Release output must be outside the tested artifact.");
  if (!/^[a-f0-9]{40}$/.test(expectedCommit || ""))
    throw new Error(
      "A verified source commit is required for release packaging.",
    );
  const { version, notes } = verifyRelease({ root, tag });
  const verification = verifyBuildVerification({
    root,
    expectedCommit,
    requireCI: false,
  });
  // Inventory both bases: packaging must never substitute an unrelated fresh build.
  const files = ["dist", "dist-pages"].flatMap((directory) => {
    if (!existsSync(join(root, directory, "index.html")))
      throw new Error(`Tested ${directory} entry point is missing.`);
    const result = staticFiles(root, directory);
    if (
      !result.some((name) => name.endsWith(".js")) ||
      !result.some((name) => name.endsWith(".css"))
    )
      throw new Error(`Tested ${directory} assets are missing.`);
    return result;
  });
  // PDF/DOCX copies must match between hosts and pass basic completeness/signature checks.
  for (const name of reportNames) {
    const primary = readFileSync(join(root, "dist/reports", name));
    const backup = readFileSync(join(root, "dist-pages/reports", name));
    if (primary.length < 10000 || !primary.equals(backup))
      throw new Error(
        `The tested builds must contain identical, complete reports: ${name}`,
      );
    if (
      name.endsWith(".pdf") &&
      !primary.subarray(0, 5).equals(Buffer.from("%PDF-"))
    )
      throw new Error("The engineering PDF signature is invalid.");
    if (
      name.endsWith(".docx") &&
      !primary.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 3, 4]))
    )
      throw new Error("The engineering DOCX signature is invalid.");
  }
  // Hash before writing the empty output directory so subsequent drift remains detectable.
  const inventory = files.map((name) => {
    const data = readFileSync(join(root, name));
    return { name, bytes: data.length, sha256: sha256(data) };
  });
  mkdirSync(output, { recursive: true });
  if (readdirSync(output).length)
    throw new Error("Release output directory must be empty.");
  for (const name of reportNames)
    copyFileSync(join(root, "dist/reports", name), join(output, name));
  const archiveName = `Cobalt_Static_Build_${tag}.tar.gz`;
  execFileSync("tar", [
    "-czf",
    join(output, archiveName),
    "-C",
    root,
    "dist",
    "dist-pages",
  ]);
  // Round-trip the actual archive before recording checksums or handing it to publication.
  const restored = mkdtempSync(join(output, "archive-check-"));
  try {
    const entries = execFileSync("tar", ["-tzf", join(output, archiveName)], {
      encoding: "utf8",
    })
      .split(/\r?\n/)
      .filter(Boolean);
    if (
      entries.some(
        (name) =>
          name.startsWith("/") ||
          name.includes("\\") ||
          name.split("/").includes("..") ||
          !/^(dist|dist-pages)(\/|$)/.test(name),
      )
    )
      throw new Error("Static archive contains an unexpected or unsafe entry.");
    execFileSync("tar", ["-xzf", join(output, archiveName), "-C", restored]);
    const restoredFiles = ["dist", "dist-pages"].flatMap((directory) =>
      staticFiles(restored, directory),
    );
    if (
      JSON.stringify(restoredFiles) !== JSON.stringify(files) ||
      inventory.some(
        ({ name, sha256: hash }) =>
          sha256(readFileSync(join(restored, name))) !== hash,
      )
    )
      throw new Error(
        "Static archive round-trip did not preserve the tested files.",
      );
  } finally {
    const cleanupTarget = resolve(restored);
    if (
      cleanupTarget === output ||
      !cleanupTarget.startsWith(`${output}${sep}`)
    )
      throw new Error(
        "Archive cleanup target must remain inside the explicit release output directory.",
      );
    rmSync(restored, { recursive: true, force: true });
  }
  // The manifest describes build files; checksums additionally cover the uploaded manifest.
  const attachedNames = [...reportNames, archiveName];
  const attachments = attachedNames.map((name) => {
    const data = readFileSync(join(output, name));
    return { name, bytes: data.length, sha256: sha256(data) };
  });
  const manifest = {
    schemaVersion: 1,
    version,
    tag,
    sourceCommit: expectedCommit,
    executionContext: verification.executionContext,
    notesSha256: sha256(notes),
    bases: { dist: "/", "dist-pages": "/cobalt-instrument-studio/" },
    checks: requiredChecks,
    files: inventory,
    attachments,
  };
  writeFileSync(
    join(output, "release-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  attachments.push({
    name: "release-manifest.json",
    bytes: readFileSync(join(output, "release-manifest.json")).length,
    sha256: sha256(readFileSync(join(output, "release-manifest.json"))),
  });
  writeFileSync(
    join(output, "SHA256SUMS.txt"),
    attachments.map((asset) => `${asset.sha256}  ${asset.name}\n`).join(""),
  );
  return { ...manifest, attachments, notes, outputDirectory: output };
}

/** Validate exact attachment names and bytes before any remote upload is permitted. */
export function verifyReleasePackage(directory) {
  const root = resolve(directory);
  const manifest = JSON.parse(
    readFileSync(join(root, "release-manifest.json"), "utf8"),
  );
  const expectedNames = [
    ...reportNames,
    `Cobalt_Static_Build_${manifest.tag}.tar.gz`,
    "release-manifest.json",
  ];
  if (
    !/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(manifest.tag || "") ||
    manifest.tag !== `v${manifest.version}` ||
    !/^[a-f0-9]{40}$/.test(manifest.sourceCommit || "")
  )
    throw new Error("Release manifest version or source commit is invalid.");
  const lines = readFileSync(join(root, "SHA256SUMS.txt"), "utf8")
    .trim()
    .split(/\r?\n/);
  const checksums = lines.map((line) => {
    const match = /^([a-f0-9]{64})  ([A-Za-z0-9_.-]+)$/.exec(line);
    if (!match || basename(match[2]) !== match[2])
      throw new Error("Invalid release checksum entry.");
    return { name: match[2], sha256: match[1] };
  });
  if (
    JSON.stringify(checksums.map((asset) => asset.name)) !==
    JSON.stringify(expectedNames)
  )
    throw new Error(
      "Release checksum inventory must cover exactly the expected attachments.",
    );
  for (const asset of checksums) {
    const data = readFileSync(join(root, asset.name));
    if (sha256(data) !== asset.sha256)
      throw new Error(`Release asset checksum mismatch: ${asset.name}`);
    const recorded = manifest.attachments.find(
      (value) => value.name === asset.name,
    );
    if (
      asset.name !== "release-manifest.json" &&
      (!recorded ||
        recorded.sha256 !== asset.sha256 ||
        recorded.bytes !== data.length)
    )
      throw new Error(`Release manifest attachment mismatch: ${asset.name}`);
    asset.bytes = data.length;
  }
  checksums.push({
    name: "SHA256SUMS.txt",
    bytes: readFileSync(join(root, "SHA256SUMS.txt")).length,
    sha256: sha256(readFileSync(join(root, "SHA256SUMS.txt"))),
  });
  return { manifest, assets: checksums };
}

// Local packaging adapter: creates inspectable files and does not call the publisher.
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const [, , artifactRoot, outputDirectory] = process.argv;
  if (!artifactRoot || !outputDirectory)
    throw new Error(
      "Usage: node scripts/package-release.mjs <tested-artifact> <output>",
    );
  const result = packageRelease({
    artifactRoot,
    outputDirectory,
    tag: process.env.RELEASE_TAG,
    expectedCommit: process.env.GITHUB_SHA,
  });
  verifyReleasePackage(result.outputDirectory);
  console.log(
    `Packaged and checksum-verified ${result.tag} from tested commit ${result.sourceCommit}.`,
  );
}
