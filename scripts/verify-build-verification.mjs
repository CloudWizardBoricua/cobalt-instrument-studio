import { readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { buildInventory, requiredChecks } from "./build-inventory.mjs";

export function verifyBuildVerification({
  root,
  expectedCommit,
  requireCI = true,
}) {
  if (!/^[a-f0-9]{40}$/.test(expectedCommit || ""))
    throw new Error("An expected source commit is required.");
  const metadata = JSON.parse(
    readFileSync(join(root, "build-verification.json"), "utf8"),
  );
  if (metadata.schemaVersion !== 1 || metadata.sourceCommit !== expectedCommit)
    throw new Error(
      "Build verification metadata must match the expected source commit.",
    );
  if (requireCI && metadata.executionContext !== "github-actions")
    throw new Error(
      "Only an artifact produced by the required GitHub CI checks may be deployed.",
    );
  if (!requiredChecks.every((name) => metadata.checks?.includes(name)))
    throw new Error("The artifact must record all required CI checks.");
  if (JSON.stringify(metadata.files) !== JSON.stringify(buildInventory(root)))
    throw new Error(
      "The build artifact differs from the SHA-256 inventory recorded after CI.",
    );
  return metadata;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const [, , artifactRoot, flag, expectedCommit] = process.argv;
  if (!artifactRoot || flag !== "--expected-commit" || !expectedCommit)
    throw new Error(
      "Usage: node scripts/verify-build-verification.mjs <tested-artifact> --expected-commit <sha>",
    );
  const metadata = verifyBuildVerification({
    root: resolve(artifactRoot),
    expectedCommit,
  });
  console.log(
    `Verified ${metadata.files.length} artifact hashes from CI commit ${metadata.sourceCommit}.`,
  );
}
