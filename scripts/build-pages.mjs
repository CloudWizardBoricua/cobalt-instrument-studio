/**
 * Build the GitHub Pages project-base variant using the same sources as Netlify.
 * Copy approved reports and typecheck before invoking Vite with the fixed public
 * project base. Node-based subprocesses avoid shell differences on Windows/Linux.
 * Output stays in dist-pages; this local build neither uploads nor deploys it.
 */
import { spawnSync } from "node:child_process";
// Shared preparation must pass before any project-base bundle can be produced.
for (const command of [
  ["scripts/sync-reports.mjs"],
  ["node_modules/typescript/bin/tsc", "--noEmit"],
]) {
  const preparation = spawnSync(process.execPath, command, {
    stdio: "inherit",
  });
  if (preparation.status !== 0) process.exit(preparation.status ?? 1);
}
// The deployed Pages URL requires this base even when the environment defaults to root.
const result = spawnSync(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "build", "--outDir", "dist-pages"],
  {
    stdio: "inherit",
    env: { ...process.env, VITE_BASE_PATH: "/cobalt-instrument-studio/" },
  },
);
process.exit(result.status ?? 1);
