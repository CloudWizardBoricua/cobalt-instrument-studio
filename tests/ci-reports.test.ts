import { afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

let sanitizeReport: (value: unknown) => any;
let prepareTestReports: (root: string) => {
  processed: string[];
  missing: string[];
  incomplete: string[];
};
beforeAll(async () => {
  ({ sanitizeReport, prepareTestReports } = await import(
    pathToFileURL(resolve("scripts/prepare-test-reports.mjs")).href
  ));
});
const temporaryRoots: string[] = [];
const fixtureRoot = () => {
  const root = mkdtempSync(join(tmpdir(), "cobalt-ci-report-"));
  temporaryRoots.push(root);
  return root;
};
afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    const location = relative(resolve(tmpdir()), resolve(root));
    if (
      location.startsWith("..") ||
      isAbsolute(location) ||
      !location.startsWith("cobalt-ci-report-")
    )
      throw new Error(
        "Temporary cleanup target is outside the test directory.",
      );
    rmSync(root, { recursive: true, force: true });
  }
});
const contact = ["sample", "@", "example", ".invalid"].join("");
const credential = ["gh", "p_", "a".repeat(36)].join("");
const privatePath = ["C:", "Users", "Example", "project", "test.ts"].join("\\");

describe("retained CI report privacy", () => {
  it("removes all Git metadata copies and private diagnostics while preserving failures and attachments", () => {
    const metadata = {
      gitCommit: { author: { email: contact } },
      gitDiff: "source diff",
      independentCommit: "a".repeat(40),
    };
    const report = {
      config: {
        metadata,
        projects: [{ metadata }],
        filteredProjects: [{ metadata }],
      },
      stats: { expected: 0, unexpected: 1 },
      errors: [
        {
          message: `Assertion failed for ${contact}; ${credential}`,
          stack: `${privatePath}:12:4`,
        },
      ],
      suites: [
        {
          tests: [
            {
              status: "unexpected",
              results: [
                {
                  status: "failed",
                  attachments: [{ path: "test-results/scenario/trace.zip" }],
                },
              ],
            },
          ],
        },
      ],
      authorization: "Bearer " + "b".repeat(36),
    };
    const safe = sanitizeReport(report);
    for (const value of [
      safe.config.metadata,
      safe.config.projects[0].metadata,
      safe.config.filteredProjects[0].metadata,
    ]) {
      expect(value.gitCommit).toBeUndefined();
      expect(value.gitDiff).toBeUndefined();
      expect(value.independentCommit).toBe("a".repeat(40));
    }
    const serialized = JSON.stringify(safe);
    for (const value of [contact, credential, privatePath])
      expect(serialized).not.toContain(value);
    expect(safe.stats).toEqual(report.stats);
    expect(safe.errors[0].message).toContain("Assertion failed");
    expect(safe.suites[0].tests[0].results[0].status).toBe("failed");
    expect(safe.suites[0].tests[0].results[0].attachments).toEqual(
      report.suites[0].tests[0].results[0].attachments,
    );
    expect(safe.authorization).toBeUndefined();
  });

  it("prepares an interrupted report on a failure path without touching screenshots, traces, or unselected files", () => {
    const root = fixtureRoot();
    mkdirSync(join(root, ".local"));
    mkdirSync(join(root, "test-results"));
    const selected = join(root, ".local/e2e-results.json");
    const escapedContact = contact.replace("@", "\\u0040");
    const interrupted = JSON.stringify({
      error: `Failed for ${contact}; ${credential}`,
      stack: privatePath,
    })
      .replace(contact, escapedContact)
      .slice(0, -1);
    writeFileSync(selected, interrupted);
    const untouched = join(root, ".local/unselected.json");
    writeFileSync(untouched, JSON.stringify({ contact }));
    const trace = Buffer.from([80, 75, 3, 4, 0, 1, 2, 3]);
    const image = Buffer.from([137, 80, 78, 71, 0, 1, 2, 3]);
    writeFileSync(join(root, "test-results/trace.zip"), trace);
    writeFileSync(join(root, "test-results/screenshot.png"), image);
    const result = prepareTestReports(root);
    const safe = JSON.parse(readFileSync(selected, "utf8"));
    expect(safe.reportStatus).toBe("incomplete");
    expect(safe.sanitizedOutput).toContain("Failed for");
    expect(safe.sanitizedOutput).not.toContain(contact);
    expect(safe.sanitizedOutput).not.toContain(escapedContact);
    expect(safe.sanitizedOutput).not.toContain(credential);
    expect(safe.sanitizedOutput).not.toContain(
      JSON.stringify(privatePath).slice(1, -1),
    );
    expect(result.processed).toEqual([".local/e2e-results.json"]);
    expect(result.incomplete).toEqual([".local/e2e-results.json"]);
    expect(result.missing).toHaveLength(5);
    expect(JSON.parse(readFileSync(untouched, "utf8")).contact).toBe(contact);
    expect(readFileSync(join(root, "test-results/trace.zip"))).toEqual(trace);
    expect(readFileSync(join(root, "test-results/screenshot.png"))).toEqual(
      image,
    );
  });

  it("fails closed when a selected report resolves outside the project", () => {
    const root = fixtureRoot(),
      outside = fixtureRoot();
    const filename = join(outside, "unit-results.json");
    const original = JSON.stringify({ errors: [contact] });
    writeFileSync(filename, original);
    symlinkSync(outside, join(root, ".local"), "junction");
    expect(() => prepareTestReports(root)).toThrow("regular project file");
    expect(readFileSync(filename, "utf8")).toBe(original);
  });
});
