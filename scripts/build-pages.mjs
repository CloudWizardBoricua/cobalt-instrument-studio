import { spawnSync } from "node:child_process";
for (const command of [
  ["scripts/sync-reports.mjs"],
  ["node_modules/typescript/bin/tsc", "--noEmit"],
]) {
  const preparation = spawnSync(process.execPath, command, {
    stdio: "inherit",
  });
  if (preparation.status !== 0) process.exit(preparation.status ?? 1);
}
const result = spawnSync(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "build", "--outDir", "dist-pages"],
  {
    stdio: "inherit",
    env: { ...process.env, VITE_BASE_PATH: "/cobalt-instrument-studio/" },
  },
);
process.exit(result.status ?? 1);
