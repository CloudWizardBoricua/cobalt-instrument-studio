import { readFile, readdir } from "node:fs/promises";
import YAML from "yaml";

const workflows = {};
for (const name of await readdir(".github/workflows")) {
  if (!name.endsWith(".yml")) continue;
  const parsed = YAML.parse(await readFile(`.github/workflows/${name}`, "utf8"));
  if (!parsed.on || !parsed.jobs) throw new Error(`Invalid workflow: ${name}`);
  workflows[name] = parsed;
}
const ci = workflows["ci.yml"];
const pages = workflows["deploy-pages.yml"];
const release = workflows["release.yml"];
if (ci.permissions.contents !== "read") throw new Error("CI must have read-only repository access.");
if (pages.jobs.deploy.needs !== "build" || pages.jobs.deploy.permissions.pages !== "write" || pages.jobs.deploy.permissions["id-token"] !== "write" || pages.jobs.deploy.environment.name !== "github-pages") throw new Error("Pages deployment must depend on its artifact build and use the Pages environment and permissions.");
if (release.jobs.release.needs !== "verify" || release.jobs.release.permissions.contents !== "write") throw new Error("Release publication must follow verification.");
if (!release.on.push.tags.includes("v*")) throw new Error("Release must be triggered by version tags.");
const packageJson = JSON.parse(await readFile("package.json", "utf8"));
if (packageJson.version !== "0.1.0" || !packageJson.private) throw new Error("Unexpected initial package version or publishing setting.");
console.log("Three workflow YAML files parsed and key permission, sequencing, and version contracts verified. Remote workflow execution remains unverified.");
