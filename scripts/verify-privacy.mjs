import { readFile, readdir } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ignored = new Set([
  "node_modules",
  ".git",
  ".local",
  ".netlify",
  "test-results",
  "playwright-report",
  "__pycache__",
]);
const textTypes = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".json",
  ".md",
  ".html",
  ".css",
  ".svg",
  ".yml",
  ".yaml",
  ".toml",
  ".txt",
  ".py",
]);
const checks = [
  [
    "credential token",
    /(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[A-Z0-9]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/,
  ],
  ["personal email", /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i],
  ["Windows user path", /[A-Z]:[\\/]Users[\\/][^\\/\s]+/i],
];
const authorCredit = "Developed by Daren Diaz";
const sourceUrl =
  "https://github.com/CloudWizardBoricua/cobalt-instrument-studio";
const normalized = (text) =>
  String(text).replace(/[—–]/g, "-").replace(/\s+/g, " ");
const month =
  "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";
const specificCalendarDate = new RegExp(
  `\\b(?:20\\d{2}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])|${month}\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s+20\\d{2})?|\\d{1,2}(?:st|nd|rd|th)?\\s+${month}\\s+20\\d{2}|\\d{1,2}/\\d{1,2}/20\\d{2})\\b`,
  "i",
);

/** Check authored content independently of rendering; browser checks establish visibility. */
export function projectContentFindings({
  app,
  model,
  readme,
  report,
  packageVersion,
}) {
  const findings = [];
  const expect = (condition, file, message) => {
    if (!condition) findings.push(`${file}: ${message}`);
  };
  expect(
    /export\s+const\s+DISCLAIMER\s*=\s*(["'])SIMULATED - NOT LIVE EQUIPMENT\1/.test(
      normalized(model),
    ),
    "src/engine/model.ts",
    "the canonical simulated-data disclaimer is required",
  );
  expect(
    /className=["']simulation-notice["']/.test(app) &&
      /<strong>\s*\{DISCLAIMER\}\s*<\/strong>/.test(app),
    "src/App.tsx",
    "the shared simulation notice must render the canonical disclaimer",
  );
  expect(
    app.includes(authorCredit) && app.includes(`href="${sourceUrl}"`),
    "src/App.tsx",
    "approved developer credit and repository link are required",
  );
  expect(
    /className=["']concept-credit["']>\s*Design concept\s*<\/span>/.test(app),
    "src/App.tsx",
    "the independent Design concept attribution is required",
  );
  expect(
    readme.includes(authorCredit) &&
      readme.includes(sourceUrl) &&
      readme.includes("Fall 2026"),
    "README.md",
    "approved developer, repository, and edition attribution are required",
  );
  expect(
    normalized(readme).includes("SIMULATED - NOT LIVE EQUIPMENT"),
    "README.md",
    "the simulated-data disclaimer is required",
  );
  expect(
    report.authorCredit === authorCredit &&
      report.authorRepository === sourceUrl,
    "docs/report-source.json",
    "report attribution must match the approved developer and repository",
  );
  expect(
    report.date === "Fall 2026" && report.version === packageVersion,
    "docs/report-source.json",
    "report edition and package version must agree",
  );
  const reportText = JSON.stringify(report.pages || []);
  expect(
    normalized(reportText).includes("SIMULATED - NOT LIVE EQUIPMENT") &&
      reportText.includes("Design concept"),
    "docs/report-source.json",
    "the report must preserve the simulation disclaimer and independent concept description",
  );
  for (const [file, text] of [
    ["README.md", readme],
    ["docs/report-source.json", JSON.stringify(report)],
  ]) {
    expect(
      !specificCalendarDate.test(text),
      file,
      "use the Fall 2026 edition rather than a specific calendar date",
    );
  }
  return findings;
}

export async function verifyPrivacy(root = process.cwd(), forbiddenTerms = []) {
  let files = 0;
  const findings = [];
  async function inspect(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (ignored.has(entry.name)) continue;
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        await inspect(path);
        continue;
      }
      if (!textTypes.has(extname(path))) continue;
      const content = await readFile(path, "utf8");
      files++;
      for (const [label, pattern] of checks)
        if (pattern.test(content)) findings.push(`${path}: ${label}`);
      for (const term of forbiddenTerms)
        if (content.toLowerCase().includes(term.toLowerCase()))
          findings.push(`${path}: restricted term detected`);
    }
  }
  await inspect(root);
  const [app, model, readme, report, packageJson] = await Promise.all(
    [
      "src/App.tsx",
      "src/engine/model.ts",
      "README.md",
      "docs/report-source.json",
      "package.json",
    ].map((name) => readFile(join(root, name), "utf8")),
  );
  findings.push(
    ...projectContentFindings({
      app,
      model,
      readme,
      report: JSON.parse(report),
      packageVersion: JSON.parse(packageJson).version,
    }),
  );
  if (findings.length) throw new Error(findings.join("\n"));
  return {
    files,
    content:
      "Simulation disclaimer, developer/repository, concept attribution, and report edition verified",
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const result = await verifyPrivacy(
      process.cwd(),
      (process.env.COBALT_FORBIDDEN_TERMS || "").split("|").filter(Boolean),
    );
    console.log(
      `Privacy/content checks passed across ${result.files} files. ${result.content}. Binary document metadata and screenshots require separate review.`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
