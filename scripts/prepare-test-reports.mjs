import { lstatSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

// This allowlist matches the JSON files selected by CI's artifact upload.
export const testReportPaths = [
  ".local/unit-results.json",
  ".local/e2e-results.json",
  ".local/browser-measurements.json",
  ".local/accessibility-measurements.json",
  ".local/device-page-layout-results.json",
  "docs/hosting-build-validation.json",
];

const privateTextPatterns = [
  /(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[A-Z0-9]{16})/g,
  /-----BEGIN (?:(?:RSA |EC |OPENSSH )?)PRIVATE KEY-----[\s\S]*?(?:-----END (?:(?:RSA |EC |OPENSSH )?)PRIVATE KEY-----|$)/g,
  /\bBearer\s+[A-Za-z0-9._~+/-]{8,}/gi,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  /[A-Z]:[\\/]+Users[\\/]+[^\\/\r\n"']+/gi,
  /((?:password|secret|access[_-]?token|refresh[_-]?token|api[_-]?key|github[_-]?token)\s*["']?\s*[:=]\s*["']?)[^\s,"'}]+/gi,
];
const omittedKeys = new Set([
  "gitcommit",
  "gitdiff",
  "authorization",
  "cookie",
  "setcookie",
  "password",
  "secret",
  "token",
  "accesstoken",
  "refreshtoken",
  "apikey",
  "githubtoken",
  "ghtoken",
  "awssecretaccesskey",
]);

export function redactPrivateText(text) {
  const original = String(text);
  // Interrupted JSON can leave escaped private text inside the retained output string.
  const decoded = original.replace(/\\u([a-f0-9]{4})/gi, (_, hex) =>
    String.fromCharCode(Number.parseInt(hex, 16)),
  );
  const candidate =
    decoded !== original &&
    privateTextPatterns.some((pattern) => decoded.search(pattern) >= 0)
      ? decoded
      : original;
  return privateTextPatterns.reduce(
    (value, pattern) => value.replace(pattern, "[REDACTED]"),
    candidate,
  );
}

export function sanitizeReport(
  value,
  stats = { removedFields: 0, redactedStrings: 0 },
) {
  if (typeof value === "string") {
    const safe = redactPrivateText(value);
    if (safe !== value) stats.redactedStrings++;
    return safe;
  }
  if (Array.isArray(value))
    return value.map((item) => sanitizeReport(item, stats));
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, item]) => {
      if (omittedKeys.has(key.replace(/[-_]/g, "").toLowerCase())) {
        stats.removedFields++;
        return [];
      }
      return [[redactPrivateText(key), sanitizeReport(item, stats)]];
    }),
  );
}

export function prepareTestReports(root = process.cwd()) {
  const projectRoot = realpathSync(root);
  const result = {
    processed: [],
    missing: [],
    removedFields: 0,
    redactedStrings: 0,
    incomplete: [],
  };
  for (const name of testReportPaths) {
    const filename = resolve(projectRoot, name);
    let info;
    try {
      info = lstatSync(filename);
    } catch (error) {
      if (error.code === "ENOENT") {
        result.missing.push(name);
        continue;
      }
      throw error;
    }
    const location = relative(projectRoot, realpathSync(filename));
    if (
      !info.isFile() ||
      info.isSymbolicLink() ||
      location.startsWith("..") ||
      isAbsolute(location)
    )
      throw new Error(
        `The selected report must be a regular project file: ${name}`,
      );
    const source = readFileSync(filename, "utf8");
    let report;
    try {
      report = JSON.parse(source);
    } catch {
      // An interrupted failure report remains inspectable without retaining private text.
      report = {
        reportStatus: "incomplete",
        message: "The generated report was not valid JSON.",
        sanitizedOutput: source,
      };
      result.incomplete.push(name);
    }
    const safe = sanitizeReport(report, result);
    const serialized = `${JSON.stringify(safe, null, 2)}\n`;
    // Validate decoded strings again; JSON escaping must not hide a private path.
    if (
      JSON.stringify(sanitizeReport(JSON.parse(serialized))) !==
      JSON.stringify(safe)
    )
      throw new Error(`Report privacy validation did not stabilize: ${name}`);
    writeFileSync(filename, serialized);
    result.processed.push(name);
  }
  return result;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  if (process.argv.length !== 2)
    throw new Error("Run this command in the project without path overrides.");
  console.log(JSON.stringify(prepareTestReports(), null, 2));
}
