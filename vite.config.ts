/**
 * Shared Vite 8 / Vitest 5 project configuration, retained at the conventional root path.
 * Netlify builds at /; build-pages.mjs explicitly supplies the project-site base and output.
 * VITE_BASE_PATH is public configuration. Dynamic report URLs use import.meta.env.BASE_URL.
 * Keep both hosting builds and node-only tests on this same dependency configuration.
 */
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // React transforms TSX; this plugin is build tooling, not a runtime device adapter.
  plugins: [react()],
  // Preserve public URLs for each existing host; no application router is installed.
  base: process.env.VITE_BASE_PATH || "/",
  // Isolate the chart library chunk without changing chart behavior or public reports.
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: { groups: [{ name: "charts", test: /node_modules[\\/]recharts[\\/]/ }] },
      },
    },
  },
  // Pure domain/script tests run in Node; browser workflows live under Playwright.
  test: { include: ["tests/**/*.test.ts"], environment: "node" },
});
