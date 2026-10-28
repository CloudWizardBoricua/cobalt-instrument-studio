/**
 * Validate stable release version, notes, report metadata and optional annotated tag.
 * Read only reviewed inputs; when requested, inspect Git object type and exact tag
 * target through an injectable runner. Mismatches stop packaging/publication.
 * No tag, release, deployment or industrial machine state is changed.
 */
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Restrict releases to stable semantic versions; prereleases and leading zeros are rejected.
const stableVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

/** Validate the reviewed release inputs without creating or changing a tag. */
export function verifyRelease({
  root = process.cwd(),
  tag = process.env.RELEASE_TAG || process.env.GITHUB_REF_NAME,
  expectedCommit,
  annotatedTag = false,
  gitRunner = execFileSync,
} = {}) {
  const version = JSON.parse(
    readFileSync(resolve(root, "package.json"), "utf8"),
  ).version;
  if (!stableVersion.test(version))
    throw new Error(
      "Package version must use stable semantic versioning without leading zeros.",
    );
  if (tag !== `v${version}`)
    throw new Error("Release tag must match the package version exactly.");
  // Four independent reviewed inputs must describe the same release version.
  const escaped = version.replaceAll(".", "\\.");
  const changelog = readFileSync(resolve(root, "CHANGELOG.md"), "utf8");
  if (
    !new RegExp(`^## (?:\\[)?${escaped}(?:\\])?(?:\\s|$)`, "m").test(changelog)
  )
    throw new Error(
      "CHANGELOG.md must contain an entry for the release version.",
    );
  const notes = readFileSync(resolve(root, "docs/RELEASE_NOTES.md"), "utf8");
  if (
    !new RegExp(`^# Cobalt Instrument Studio ${escaped}\\s*$`, "m").test(notes)
  )
    throw new Error(
      "Release notes heading must match the package version exactly.",
    );
  if (!notes.includes("Telemetry is simulated"))
    throw new Error(
      "Release notes must preserve the simulated-data disclaimer.",
    );
  const report = JSON.parse(
    readFileSync(resolve(root, "docs/report-source.json"), "utf8"),
  );
  if (report.version !== version)
    throw new Error(
      "Engineering report version must match the package version.",
    );
  // Optional Git checks establish object type and target, rather than assuming any v* ref is valid.
  if (annotatedTag) {
    const objectType = gitRunner(
      "git",
      ["cat-file", "-t", `refs/tags/${tag}`],
      {
        cwd: root,
        encoding: "utf8",
      },
    ).trim();
    if (objectType !== "tag")
      throw new Error("Release tags must be annotated tags.");
    const commit = gitRunner(
      "git",
      ["rev-parse", `refs/tags/${tag}^{commit}`],
      {
        cwd: root,
        encoding: "utf8",
      },
    ).trim();
    if (
      !/^[a-f0-9]{40}$/.test(expectedCommit || "") ||
      commit !== expectedCommit
    )
      throw new Error(
        "Annotated tag must resolve to the commit being verified.",
      );
  }
  return { version, tag, notes };
}

// Tag-workflow preflight enables annotated-tag verification; local validation stays read-only.
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const result = verifyRelease({
    annotatedTag: process.env.GITHUB_ACTIONS === "true",
    expectedCommit: process.env.GITHUB_SHA,
  });
  console.log(
    `Verified release inputs for ${result.tag}; no tag or release was modified.`,
  );
}
