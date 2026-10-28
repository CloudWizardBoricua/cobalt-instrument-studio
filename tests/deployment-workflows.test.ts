/**
 * Keep the static demo's existing CI, Pages and release publication boundaries explicit.
 * Mutated YAML fixtures must be rejected for mutable actions, broad permissions or
 * unsafe report retention; injected HTTP responses exercise the current-main guard.
 * All workflow validation is local, and no test publishes or changes provider settings.
 * Repository-root execution and the three maintained workflow paths are intentional.
 */
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

let validateWorkflow: (source: string, filename: string) => unknown;
let verifyWorkflowDirectory: (root?: string) => { requiredCheck: string };
let isCurrentPagesSource: (options: {
  repository: string;
  expectedCommit: string;
  request: () => Promise<Response>;
}) => Promise<boolean>;
// Import production validators by file URL so Windows drive-letter paths resolve correctly.
beforeAll(async () => {
  ({ validateWorkflow, verifyWorkflowDirectory } = await import(
    pathToFileURL(resolve("scripts/verify-config.mjs")).href
  ));
  ({ isCurrentPagesSource } = await import(
    pathToFileURL(resolve("scripts/check-pages-source.mjs")).href
  ));
});

// Normalize fixture text so multiline mutations also exercise the intended case on CRLF checkouts.
const ci = readFileSync(".github/workflows/ci.yml", "utf8").replace(/\r\n/g, "\n");
// Keep mutated workflow copies disposable and bound cleanup to their generated prefix.
const temporaryRoots: string[] = [];
afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    const location = relative(resolve(tmpdir()), resolve(root));
    if (
      location.startsWith("..") ||
      isAbsolute(location) ||
      !location.startsWith("cobalt-ci-workflow-")
    )
      throw new Error(
        "Temporary cleanup target is outside the test directory.",
      );
    rmSync(root, { recursive: true, force: true });
  }
});
// Other workflow files remain real copies, exposing cross-workflow contract regressions.
const workflowFixture = (source: string) => {
  const root = mkdtempSync(join(tmpdir(), "cobalt-ci-workflow-"));
  temporaryRoots.push(root);
  mkdirSync(join(root, ".github/workflows"), { recursive: true });
  for (const name of ["ci.yml", "deploy-pages.yml", "release.yml"])
    copyFileSync(
      `.github/workflows/${name}`,
      join(root, `.github/workflows/${name}`),
    );
  copyFileSync(".github/dependabot.yml", join(root, ".github/dependabot.yml"));
  writeFileSync(join(root, ".github/workflows/ci.yml"), source);
  return root;
};
// These negative fixtures reject unsafe configuration; they do not execute GitHub Actions.
describe("workflow validation and publication boundaries", () => {
  it("accepts the complete existing-path workflow contract", () =>
    expect(verifyWorkflowDirectory().requiredCheck).toBe("CI verification"));
  it("rejects mutable action references", () =>
    expect(() =>
      validateWorkflow(
        ci.replace(/actions\/checkout@[a-f0-9]{40}/, "actions/checkout@v6"),
        "ci.yml",
      ),
    ).toThrow("immutable"));
  it("rejects blanket token write permission", () =>
    expect(() =>
      validateWorkflow(
        ci.replace("contents: read", "contents: write"),
        "ci.yml",
      ),
    ).toThrow("read only"));
  it("rejects artifacts that could retain local credentials and tooling", () =>
    expect(() =>
      validateWorkflow(
        ci.replace(".local/unit-results.json", ".local/"),
        "ci.yml",
      ),
    ).toThrow("paths"));
  it("rejects unset or unbounded artifact retention", () =>
    expect(() =>
      validateWorkflow(
        ci.replace("retention-days: 14", "retention-days: 0"),
        "ci.yml",
      ),
    ).toThrow("retention"));
  it("rejects write permission on a reusable CI caller", () => {
    const release = readFileSync(".github/workflows/release.yml", "utf8");
    expect(() =>
      validateWorkflow(
        release.replace(
          "uses: ./.github/workflows/ci.yml",
          "permissions:\n      contents: write\n    uses: ./.github/workflows/ci.yml",
        ),
        "release.yml",
      ),
    ).toThrow("unnecessary");
  });
  it("rejects report upload that bypasses privacy preparation", () => {
    const root = workflowFixture(
      ci.replace(
        "if: always() && steps.test-report-privacy.outcome == 'success'",
        "if: always()",
      ),
    );
    expect(() => verifyWorkflowDirectory(root)).toThrow(
      "private-safe preparation",
    );
  });
  it("requires report preparation to run after test failure", () => {
    const root = workflowFixture(
      ci.replace(
        "id: test-report-privacy\n        if: always()",
        "id: test-report-privacy\n        if: success()",
      ),
    );
    expect(() => verifyWorkflowDirectory(root)).toThrow(
      "private-safe preparation",
    );
  });
  it("rejects a retained JSON report absent from the sanitizer allowlist", () => {
    const root = workflowFixture(
      ci.replace(".local/unit-results.json", ".local/uninspected-report.json"),
    );
    expect(() => verifyWorkflowDirectory(root)).toThrow(
      "private-safe preparation",
    );
  });
});

// Mock the GitHub ref response: an older successful CI artifact must not replace current main.
describe("Pages freshness guard", () => {
  const commit = "a".repeat(40),
    newer = "b".repeat(40);
  const repository = "CloudWizardBoricua/cobalt-instrument-studio";
  it("allows only the expected current main source", async () => {
    for (const [sha, allowed] of [
      [commit, true],
      [newer, false],
    ] as const) {
      const request = async () =>
        new Response(
          JSON.stringify({ ref: "refs/heads/main", object: { sha } }),
        );
      expect(
        await isCurrentPagesSource({
          repository,
          expectedCommit: commit,
          request,
        }),
      ).toBe(allowed);
    }
  });
  it("fails closed on API or invalid-reference failures", async () => {
    await expect(
      isCurrentPagesSource({
        repository,
        expectedCommit: commit,
        request: async () => new Response("", { status: 403 }),
      }),
    ).rejects.toThrow("HTTP 403");
    await expect(
      isCurrentPagesSource({
        repository,
        expectedCommit: commit,
        request: async () =>
          new Response(
            JSON.stringify({ ref: "refs/tags/wrong", object: { sha: commit } }),
          ),
      }),
    ).rejects.toThrow("invalid reference");
  });
});
