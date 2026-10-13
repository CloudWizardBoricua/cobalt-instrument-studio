import { beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

type Content = {
  app: string;
  model: string;
  readme: string;
  report: Record<string, any>;
  packageVersion: string;
};
let projectContentFindings: (content: Content) => string[];
beforeAll(async () => {
  ({ projectContentFindings } = await import(
    pathToFileURL(resolve("scripts/verify-privacy.mjs")).href
  ));
});
const source: Content = {
  app: readFileSync("src/App.tsx", "utf8"),
  model: readFileSync("src/engine/model.ts", "utf8"),
  readme: readFileSync("README.md", "utf8"),
  report: JSON.parse(readFileSync("docs/report-source.json", "utf8")),
  packageVersion: JSON.parse(readFileSync("package.json", "utf8")).version,
};
const fixture = () => structuredClone(source);

describe("independent project content requirements", () => {
  it("accepts the actual approved application and shared report source", () => {
    expect(projectContentFindings(fixture())).toEqual([]);
  });
  it("fails if the notice disappears even when the disclaimer constant remains", () => {
    const content = fixture();
    content.app = content.app.replace(
      "<strong>{DISCLAIMER}</strong>",
      "<strong>Ready</strong>",
    );
    expect(projectContentFindings(content).join("\n")).toContain(
      "shared simulation notice",
    );
  });
  it("fails when the canonical disclaimer or report disclaimer is removed", () => {
    const content = fixture();
    content.model = content.model.replace(
      "SIMULATED — NOT LIVE EQUIPMENT",
      "EQUIPMENT DATA",
    );
    content.report.pages = [];
    const findings = projectContentFindings(content).join("\n");
    expect(findings).toContain("canonical simulated-data disclaimer");
    expect(findings).toContain("report must preserve");
  });
  it("fails if the developer link or neutral concept label changes", () => {
    const content = fixture();
    content.app = content.app
      .replace(
        'href="https://github.com/CloudWizardBoricua/cobalt-instrument-studio"',
        'href="https://example.com"',
      )
      .replace(">Design concept</span>", ">Equipment vendor</span>");
    const findings = projectContentFindings(content).join("\n");
    expect(findings).toContain("approved developer credit and repository");
    expect(findings).toContain("independent Design concept");
  });
  it("fails if shared report attribution, date or version differs from the approved metadata", () => {
    const content = fixture();
    content.report.authorCredit = "A different author";
    content.report.authorRepository = "https://example.com";
    content.report.date = "A precise calendar date";
    content.report.version = "9.9.9";
    const findings = projectContentFindings(content).join("\n");
    expect(findings).toContain("report attribution must match");
    expect(findings).toContain("report edition and package version");
  });
  it("fails if README loses the disclaimer", () => {
    const content = fixture();
    content.readme = content.readme.replace(
      "SIMULATED — NOT LIVE EQUIPMENT",
      "Equipment status",
    );
    const findings = projectContentFindings(content).join("\n");
    expect(findings).toContain("README.md: the simulated-data disclaimer");
  });
  it.each(["2026-01-01", "January 1, 2026", "1 January 2026", "1/1/2026"])(
    "fails if documentation introduces the specific calendar date %s",
    (date) => {
      const content = fixture();
      content.readme += `\nEdition ${date}\n`;
      const findings = projectContentFindings(content).join("\n");
      expect(findings).toContain("specific calendar date");
    },
  );
});
