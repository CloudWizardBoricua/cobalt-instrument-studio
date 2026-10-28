/**
 * Publish one source-bound versioned release after the tag workflow verifies it.
 * Validate the local package, remote annotated tag and run URL, create a draft,
 * upload/read back each asset, then publish once. Existing public releases stay
 * unchanged and existing drafts stop for review. The CLI requires GitHub Actions;
 * unit tests inject mock HTTP. This file has real remote-write capability.
 */
import { readFileSync, appendFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { sha256, verifyReleasePackage } from "./package-release.mjs";
import { verifyRelease } from "./verify-release.mjs";

const apiOrigin = "https://api.github.com";
const uploadOrigin = "https://uploads.github.com";

/** The workflow is the only caller allowed to publish; tests inject a mock HTTP transport. */
export async function publishRelease({
  directory,
  artifactRoot,
  repository,
  token,
  tag,
  expectedCommit,
  runUrl,
  fetchImpl = fetch,
}) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository || "") || !token)
    throw new Error(
      "An explicit GitHub repository and workflow token are required.",
    );
  // Verify reviewed local bytes and identity before making any GitHub request.
  const { manifest, assets } = verifyReleasePackage(directory);
  const verified = verifyRelease({ root: artifactRoot, tag });
  if (
    manifest.tag !== verified.tag ||
    manifest.sourceCommit !== expectedCommit ||
    manifest.notesSha256 !== sha256(verified.notes) ||
    manifest.executionContext !== "github-actions"
  )
    throw new Error(
      "Packaged release must match the verified tag and source commit.",
    );
  const expectedRunPrefix = `https://github.com/${repository}/actions/runs/`;
  if (
    !runUrl?.startsWith(expectedRunPrefix) ||
    !/^\d+$/.test(runUrl.slice(expectedRunPrefix.length))
  )
    throw new Error(
      "Release notes require the actual verification workflow run URL.",
    );
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2026-03-10",
  };
  const endpoint = `/repos/${repository}`;
  // Only explicit 404 handling represents absence; authorization/server errors stop publication.
  const request = async (method, path, body, allowNotFound = false) => {
    const response = await fetchImpl(`${apiOrigin}${path}`, {
      method,
      headers: { ...headers, "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (allowNotFound && response.status === 404) return null;
    if (!response.ok)
      throw new Error(
        `GitHub ${method} request failed with HTTP ${response.status}; publication stopped.`,
      );
    return response.json();
  };
  let existing = await request(
    "GET",
    `${endpoint}/releases/tags/${encodeURIComponent(tag)}`,
    undefined,
    true,
  );
  // The by-tag endpoint may omit drafts. Authenticated listing prevents duplicate drafts on reruns.
  if (!existing) {
    for (let page = 1; ; page += 1) {
      const releases = await request(
        "GET",
        `${endpoint}/releases?per_page=100&page=${page}`,
      );
      if (!Array.isArray(releases))
        throw new Error("GitHub returned an invalid release listing.");
      existing = releases.find((release) => release.tag_name === tag);
      if (existing || releases.length < 100) break;
    }
  }
  if (existing) {
    if (existing.draft)
      throw new Error(
        "A draft release already exists. Review it manually; this workflow will not overwrite or delete it.",
      );
    console.log(
      `Release ${tag} already exists; it and its assets remain unchanged.`,
    );
    return { status: "existing-unchanged", url: existing.html_url };
  }
  // The already-created remote tag must be annotated and point to the tested commit.
  const tagRef = await request(
    "GET",
    `${endpoint}/git/ref/tags/${encodeURIComponent(tag)}`,
  );
  if (tagRef.object?.type !== "tag")
    throw new Error(
      "The remote release tag must already exist and be annotated.",
    );
  const tagObject = await request(
    "GET",
    `${endpoint}/git/tags/${tagRef.object.sha}`,
  );
  if (
    tagObject.object?.type !== "commit" ||
    tagObject.object.sha !== expectedCommit
  )
    throw new Error(
      "The remote annotated tag must match the tested source commit.",
    );
  const checksumRows = assets
    .map((asset) => `| ${asset.name} | ${asset.sha256} |`)
    .join("\n");
  const body = `${verified.notes.replaceAll("\r\n", "\n").trim()}\n\nVerified by [this Actions run](${runUrl}) at commit \`${expectedCommit}\`. Both static hosting builds passed CI before packaging.\n\nSHA-256 checksums:\n\n| Attachment | SHA-256 |\n| --- | --- |\n${checksumRows}\n`;
  // A failed upload leaves one inspectable draft. Reruns will refuse to mutate it.
  const draft = await request("POST", `${endpoint}/releases`, {
    tag_name: tag,
    target_commitish: expectedCommit,
    name: `Cobalt Instrument Studio ${tag}`,
    body,
    draft: true,
    prerelease: false,
    generate_release_notes: false,
  });
  if (!Number.isSafeInteger(draft.id) || draft.draft !== true)
    throw new Error(
      "GitHub did not return the expected draft release; publication stopped.",
    );
  const uploadBase = new URL(draft.upload_url.replace(/\{.*$/, ""));
  if (
    uploadBase.origin !== uploadOrigin ||
    uploadBase.pathname !== `${endpoint}/releases/${draft.id}/assets`
  )
    throw new Error(
      "GitHub returned an unexpected asset upload URL; publication stopped.",
    );
  // Verify every uploaded body by downloading it again before the draft can become public.
  for (const asset of assets) {
    const data = readFileSync(join(directory, asset.name));
    const upload = new URL(uploadBase);
    upload.searchParams.set("name", asset.name);
    const response = await fetchImpl(upload, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/octet-stream" },
      body: data,
    });
    if (!response.ok)
      throw new Error(
        `Asset upload failed with HTTP ${response.status}; release remains a draft.`,
      );
    const uploaded = await response.json();
    if (
      uploaded.name !== asset.name ||
      uploaded.size !== data.length ||
      uploaded.state !== "uploaded" ||
      (uploaded.digest && uploaded.digest !== `sha256:${asset.sha256}`) ||
      !Number.isSafeInteger(uploaded.id)
    )
      throw new Error(
        `Uploaded asset metadata mismatch: ${asset.name}; release remains a draft.`,
      );
    const download = await fetchImpl(
      `${apiOrigin}${endpoint}/releases/assets/${uploaded.id}`,
      {
        headers: { ...headers, Accept: "application/octet-stream" },
      },
    );
    if (
      !download.ok ||
      sha256(Buffer.from(await download.arrayBuffer())) !== asset.sha256
    )
      throw new Error(
        `Uploaded asset download checksum mismatch: ${asset.name}; release remains a draft.`,
      );
  }
  // Check the complete remote inventory, then publish and verify the resulting release again.
  const attached = await request(
    "GET",
    `${endpoint}/releases/${draft.id}/assets`,
  );
  if (
    !Array.isArray(attached) ||
    attached.length !== assets.length ||
    assets.some(
      (asset) =>
        !attached.some(
          (value) => value.name === asset.name && value.size === asset.bytes,
        ),
    )
  )
    throw new Error(
      "Release asset inventory mismatch; release remains a draft.",
    );
  const published = await request("PATCH", `${endpoint}/releases/${draft.id}`, {
    draft: false,
  });
  if (
    published.draft !== false ||
    published.tag_name !== tag ||
    published.body?.replaceAll("\r\n", "\n") !== body
  )
    throw new Error(
      "Published release metadata did not match the verified draft.",
    );
  const current = await request(
    "GET",
    `${endpoint}/releases/tags/${encodeURIComponent(tag)}`,
  );
  if (
    current.id !== draft.id ||
    current.draft !== false ||
    current.body?.replaceAll("\r\n", "\n") !== body ||
    current.assets?.length !== assets.length ||
    assets.some(
      (asset) =>
        !current.assets.some(
          (value) => value.name === asset.name && value.size === asset.bytes,
        ),
    )
  )
    throw new Error("Final published release verification failed.");
  console.log(`Published and verified one release: ${current.html_url}`);
  return { status: "published-verified", url: current.html_url, assets };
}

// Live-write entry point: the verified tag workflow supplies the token and source identity.
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  if (process.env.GITHUB_ACTIONS !== "true")
    throw new Error(
      "Publication is restricted to the tag-triggered GitHub workflow.",
    );
  const [, , directory, artifactRoot] = process.argv;
  if (!directory || !artifactRoot)
    throw new Error(
      "Usage: node scripts/publish-release.mjs <release-package> <tested-artifact>",
    );
  const result = await publishRelease({
    directory,
    artifactRoot,
    repository: process.env.GITHUB_REPOSITORY,
    token: process.env.GH_TOKEN,
    tag: process.env.RELEASE_TAG,
    expectedCommit: process.env.GITHUB_SHA,
    runUrl: `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
  });
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `Release result: **${result.status}**. [Open release](${result.url}).\n`,
    );
}
