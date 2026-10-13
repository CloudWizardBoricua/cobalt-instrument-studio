import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseDocument } from "yaml";
import { testReportPaths } from "./prepare-test-reports.mjs";

export function validateWorkflow(source, filename) {
  const document = parseDocument(source, { uniqueKeys: true });
  if (document.errors.length)
    throw new Error(`${filename}: ${document.errors[0].message}`);
  const workflow = document.toJS();
  const fail = (message) => {
    throw new Error(`${filename}: ${message}`);
  };
  if (!workflow?.name || !workflow.on || !workflow.jobs)
    fail("Named workflow, triggers, and jobs are required.");
  if (
    JSON.stringify(workflow.permissions) !==
    JSON.stringify({ contents: "read" })
  )
    fail("Workflow token must default to contents: read only.");
  if (workflow.on.pull_request_target)
    fail("Privileged pull-request execution is outside this project workflow.");
  for (const [jobId, job] of Object.entries(workflow.jobs)) {
    if (!job.name) fail(`Job ${jobId} must have a reviewer-readable name.`);
    for (const [scope, permission] of Object.entries(job.permissions || {})) {
      const mayWrite =
        (filename === "deploy-pages.yml" &&
          jobId === "deploy" &&
          ["pages", "id-token"].includes(scope)) ||
        (filename === "release.yml" &&
          jobId === "release" &&
          scope === "contents");
      if (permission === "write" && !mayWrite)
        fail(`Job ${jobId} grants unnecessary ${scope} write permission.`);
      if (!["read", "write", "none"].includes(permission))
        fail("Token permissions must be explicit values.");
    }
    if (job.uses) {
      if (job.uses !== "./.github/workflows/ci.yml")
        fail("Reuse the existing local CI workflow.");
      continue;
    }
    if (!job["timeout-minutes"] || job["timeout-minutes"] > 30)
      fail(`Job ${jobId} needs a bounded timeout.`);
    for (const step of job.steps || []) {
      if (!step.name) fail(`Every ${jobId} step needs a descriptive name.`);
      if (!step.uses) continue;
      if (!/^actions\/[\w-]+@[a-f0-9]{40}$/.test(step.uses))
        fail(
          `Action ${step.uses} must use an official repository and immutable full SHA.`,
        );
      const action = step.uses.split("@")[0];
      if (
        action === "actions/checkout" &&
        step.with?.["persist-credentials"] !== false
      )
        fail("Checkout must not persist credentials.");
      if (
        ["actions/upload-artifact", "actions/upload-pages-artifact"].includes(
          action,
        )
      ) {
        const retention = step.with?.["retention-days"];
        if (!Number.isInteger(retention) || retention < 1 || retention > 30)
          fail("Artifact retention must be explicit and bounded.");
        const paths = String(step.with?.path || "")
          .split(/\r?\n/)
          .map((value) => value.trim())
          .filter(Boolean);
        if (
          !paths.length ||
          paths.some((path) =>
            [
              ".",
              "./",
              "**",
              "**/*",
              ".local",
              ".local/",
              ".netlify/",
              ".git/",
              "node_modules/",
            ].includes(path),
          )
        )
          fail(
            "Artifact paths must exclude whole workspace, dependency, and credential directories.",
          );
        const releaseFiles = new Set([
          ".local/release-package/Cobalt_Engineering_Report.pdf",
          ".local/release-package/Cobalt_Engineering_Report.docx",
          ".local/release-package/Cobalt_Static_Build_${{ github.ref_name }}.tar.gz",
          ".local/release-package/SHA256SUMS.txt",
          ".local/release-package/release-manifest.json",
        ]);
        if (
          step.with?.["include-hidden-files"] === true &&
          paths.some(
            (path) =>
              path.startsWith(".local/") &&
              !/^\.local\/[\w-]+\.json$/.test(path) &&
              !(
                filename === "release.yml" &&
                jobId === "release" &&
                releaseFiles.has(path)
              ),
          )
        )
          fail(
            "Only named JSON reports or explicit verified release files may be retained from .local.",
          );
      }
    }
  }
  return workflow;
}

export function verifyWorkflowDirectory(root = process.cwd()) {
  const directory = resolve(root, ".github/workflows");
  const names = readdirSync(directory)
    .filter((name) => /\.ya?ml$/.test(name))
    .sort();
  if (names.join(",") !== "ci.yml,deploy-pages.yml,release.yml")
    throw new Error(
      "Keep the three existing workflow paths; duplicate publication workflows are not allowed.",
    );
  const workflows = Object.fromEntries(
    names.map((name) => [
      name,
      validateWorkflow(readFileSync(resolve(directory, name), "utf8"), name),
    ]),
  );
  const ci = workflows["ci.yml"],
    pages = workflows["deploy-pages.yml"],
    release = workflows["release.yml"];
  if (
    !Object.hasOwn(ci.on, "pull_request") ||
    ci.on.push?.branches?.join() !== "main" ||
    !Object.hasOwn(ci.on, "workflow_call")
  )
    throw new Error(
      "CI must run for pull requests, main pushes, and tagged-source reuse.",
    );
  if (
    ci.on.pull_request?.paths ||
    ci.on.pull_request?.["paths-ignore"] ||
    ci.on.push.paths ||
    ci.on.push["paths-ignore"]
  )
    throw new Error(
      "Required CI must not skip dependency-only or documentation-only changes.",
    );
  const runs = ci.jobs.verify.steps.map((step) => step.run).filter(Boolean);
  for (const required of [
    "npm ci",
    "npm run verify:workflows",
    "npm run typecheck",
    "npm run test:ci",
    "npm run verify:privacy",
    "npm run build",
    "npm run build:pages",
    "npm run test:e2e",
    "npm run verify:static -- --skip-build",
    "node scripts/record-build-verification.mjs",
  ]) {
    if (!runs.includes(required))
      throw new Error(`CI is missing required validation: ${required}`);
  }
  const uploads = ci.jobs.verify.steps.filter((step) =>
    step.uses?.startsWith("actions/upload-artifact@"),
  );
  const tests = uploads.find((step) =>
    step.with.name.startsWith("cobalt-test-results-"),
  );
  const production = uploads.find((step) =>
    step.with.name.startsWith("cobalt-production-builds-"),
  );
  const reportPrivacy = ci.jobs.verify.steps.find(
    (step) => step.id === "test-report-privacy",
  );
  const uploadedJSONReports = String(tests?.with?.path || "")
    .split(/\r?\n/)
    .map((path) => path.trim())
    .filter((path) => path.endsWith(".json"))
    .sort();
  if (
    tests?.if !==
      "always() && steps.test-report-privacy.outcome == 'success'" ||
    reportPrivacy?.if !== "always()" ||
    reportPrivacy.run !== "node scripts/prepare-test-reports.mjs" ||
    ci.jobs.verify.steps.indexOf(reportPrivacy) >=
      ci.jobs.verify.steps.indexOf(tests) ||
    ci.jobs.verify.steps.indexOf(reportPrivacy) >=
      ci.jobs.verify.steps.indexOf(production) ||
    JSON.stringify(uploadedJSONReports) !==
      JSON.stringify([...testReportPaths].sort()) ||
    tests.with["retention-days"] !== 7 ||
    production?.with["retention-days"] !== 14 ||
    production.if ||
    production.with.overwrite
  )
    throw new Error(
      "Test evidence requires private-safe preparation on failure paths; production artifacts require success and attempt-specific retention.",
    );
  const prepare = pages.jobs.prepare;
  for (const gate of [
    "conclusion == 'success'",
    "event == 'push'",
    "head_branch == 'main'",
    "head_repository.full_name == github.repository",
  ])
    if (!prepare.if?.includes(gate))
      throw new Error(
        "Pages must exclude failed, fork, and pull-request producers.",
      );
  if (
    Object.keys(pages.on).join() !== "workflow_run" ||
    pages.on.workflow_run.workflows?.join() !== ci.name ||
    pages.jobs.deploy.needs !== "prepare"
  )
    throw new Error("Pages must follow the successful existing CI workflow.");
  const download = prepare.steps.find((step) =>
    step.uses?.startsWith("actions/download-artifact@"),
  );
  if (
    !download?.with["run-id"]?.includes("workflow_run.id") ||
    !download.with.name?.includes("workflow_run.run_attempt") ||
    !prepare.steps.some((step) =>
      step.run?.includes("verify-build-verification.mjs"),
    ) ||
    !prepare.steps.some(
      (step) => step.run === "node scripts/check-pages-source.mjs",
    )
  )
    throw new Error(
      "Pages must bind exact upstream artifacts and prevent stale deployments.",
    );
  if (
    release.jobs.verify.uses !== "./.github/workflows/ci.yml" ||
    release.jobs.verify.needs !== "preflight"
  )
    throw new Error(
      "Release verification must reuse CI after version preflight.",
    );
  if (
    !ci.on.workflow_call.outputs?.["production-artifact-id"]?.value?.includes(
      "jobs.verify.outputs.production-artifact-id",
    ) ||
    !ci.jobs.verify.outputs?.["production-artifact-id"]?.includes(
      "steps.production.outputs.artifact-id",
    )
  )
    throw new Error(
      "Reusable CI must expose the immutable successful artifact ID.",
    );
  if (release.jobs.release.needs?.join() !== "preflight,verify")
    throw new Error(
      "Release publication must follow both tag preflight and reusable CI.",
    );
  const releaseDownload = release.jobs.release.steps.find((step) =>
    step.uses?.startsWith("actions/download-artifact@"),
  );
  if (
    releaseDownload?.with?.["artifact-ids"] !==
    "${{ needs.verify.outputs.production-artifact-id }}"
  )
    throw new Error("Release must download the exact verified artifact ID.");
  const dependabot = parseDocument(
    readFileSync(resolve(root, ".github/dependabot.yml"), "utf8"),
  ).toJS();
  if (
    dependabot.version !== 2 ||
    !["npm", "github-actions"].every((ecosystem) =>
      dependabot.updates.some(
        (update) =>
          update["package-ecosystem"] === ecosystem &&
          update.directory === "/" &&
          update.schedule.interval === "weekly",
      ),
    )
  )
    throw new Error("Dependency updates must cover npm and GitHub Actions.");
  return {
    workflows: names,
    requiredCheck: ci.jobs.verify.name,
    actionPins: "Full immutable references",
    publication: "Not performed by this validator",
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  console.log(JSON.stringify(verifyWorkflowDirectory(), null, 2));
