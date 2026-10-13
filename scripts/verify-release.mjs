import { readFileSync } from "node:fs";
const version = JSON.parse(readFileSync("package.json", "utf8")).version;
const tag = process.env.RELEASE_TAG || process.env.GITHUB_REF_NAME;
if (tag !== `v${version}`)
  throw new Error("Release tag must match the package version exactly.");
if (!/^\d+\.\d+\.\d+$/.test(version))
  throw new Error("Package version must use stable semantic versioning.");
console.log(`Verified release version ${version}`);
