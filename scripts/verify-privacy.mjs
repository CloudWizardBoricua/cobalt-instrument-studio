import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";

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
const forbiddenTerms = (process.env.COBALT_FORBIDDEN_TERMS || "")
  .split("|")
  .filter(Boolean);
const checks = [
  [
    "credential token",
    /(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[A-Z0-9]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/,
  ],
  ["personal email", /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i],
  ["Windows user path", /[A-Z]:[\\/]Users[\\/][^\\/\s]+/i],
];
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
await inspect(".");
if (findings.length) {
  console.error(findings.join("\n"));
  process.exit(1);
}
console.log(
  `Privacy text scan passed across ${files} files. Binary document metadata and screenshots require separate review.`,
);
