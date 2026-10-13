# Hosting and DevOps verification

_Developed by Daren Diaz_ · [GitHub repository](https://github.com/CloudWizardBoricua/cobalt-instrument-studio)

Fall 2026

**Feature branch review:** Application hardening, the neutral Design concept label, and the workflow improvements are approved for a feature branch push and real PR creation. Modified GitHub execution and actual new PR/run links remain pending. Existing public run links verify the published baseline only. Merging to `main`, production deployment, and a new version tag/Release remain separately authorized steps; main sites and the existing release are unchanged.

Version 0.1.0 is publicly hosted at two independent HTTPS endpoints. Both serve static assets and run the simulation inside the visitor's browser; the development computer does not need to remain powered on.

## Verified endpoints

| Endpoint          | URL                                                                                                                     | Role                                 |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Netlify           | [cobalt-instrument-studio.netlify.app](https://cobalt-instrument-studio.netlify.app/)                                   | Primary shareable demo               |
| GitHub Pages      | [cloudwizardboricua.github.io/cobalt-instrument-studio](https://cloudwizardboricua.github.io/cobalt-instrument-studio/) | Independent backup                   |
| GitHub repository | [CloudWizardBoricua/cobalt-instrument-studio](https://github.com/CloudWizardBoricua/cobalt-instrument-studio)           | Public source; default branch `main` |

Anonymous HTTPS checks passed for each site's HTML entry, referenced assets, repository link, observed README, and direct PDF/DOCX downloads. At that historical checkpoint, downloaded report bytes matched the then-current artifacts. Both origins passed live checks for six changing instruments, mode and speed/load controls, Start/Pause/Reset, normal replay, overheat acknowledgment, and communication timeout/recovery. Dashboard, Diagnostics, and Settings each fit a 390 px viewport without horizontal overflow; observed error-level console logs were empty. [Public browser validation](public-browser-validation.json) and [public HTTP validation](public-http-validation.json) record the results. These checks establish observed access and behavior, not future availability.

Read-only verification found the latest published baseline at commit `421ea725f9be740f86d7b61e445e37e18a1f4d0b`: [CI succeeded](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38333357919) with 32 unit tests and 7 Chromium browser tests; the [Pages deployment succeeded](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38333358441), and the [Netlify deployment is ready](https://app.netlify.com/sites/cobalt-instrument-studio/deploys/6acd8c5cd6fa3bd467203c8f). Current anonymous HTTPS checks returned 200 for both entries, referenced assets, and direct reports. Report hashes matched the unchanged initial release.

Fresh real-clock browser checks passed 10 check groups on each production site: six instruments, telemetry/pause/reset, operating modes/keyboard targets, the three published scenarios including acknowledgment and timeout/recovery, three mobile views without overflow, theme/unit persistence, report-link behavior, and no browser console/page errors. These observations concern published source with three scenarios; they do not validate the local five-scenario hardening or device workspace as deployed. [Remote workflow baseline](workflow-remote-baseline.json) records the actual runs, HTTP/browser observations, tag/release inspection, and repository protection state.

## Build and deployment paths

`npm run build` creates Netlify-compatible root assets in `dist`. Netlify's existing repository integration builds `main` with that command and publishes `dist`. `npm run build:pages` creates project-relative assets in `dist-pages` with base `/cobalt-instrument-studio/`. Each build includes `reports/Cobalt_Engineering_Report.pdf` and its DOCX counterpart. Navigation changes local view state, so no app routes or rewrites are required.

The locally improved Pages workflow waits for a completed successful **Continuous integration** run whose event is a push to this repository's `main`. It downloads `cobalt-production-builds-<attempt>` from that exact upstream run and attempt, validates the source/build evidence, and deploys its tested `dist-pages` output without rebuilding. It also skips a completed source revision that is no longer the current `main`. A failed, canceled, PR, fork, or other-branch CI run cannot authorize Pages publication. The direct manual trigger is removed so it cannot bypass this verification gate. These safeguards are configured locally and still require an actual authorized GitHub execution.

After authorized publication, inspect the successful main CI and Pages run links, both production entries and every referenced asset. Exercise Start/Pause/Reset, mode and speed/load controls, all five scenarios, rejection/timeout/recovery, acknowledgment, and the device workspace at desktop/mobile widths. Download each report directly from both origins and compare its SHA-256 to the reviewed version. Record results against the published commit; a status badge or HTTP 200 alone does not prove those behaviors.

- Netlify reports: [PDF](https://cobalt-instrument-studio.netlify.app/reports/Cobalt_Engineering_Report.pdf) · [DOCX](https://cobalt-instrument-studio.netlify.app/reports/Cobalt_Engineering_Report.docx)
- Pages reports: [PDF](https://cloudwizardboricua.github.io/cobalt-instrument-studio/reports/Cobalt_Engineering_Report.pdf) · [DOCX](https://cloudwizardboricua.github.io/cobalt-instrument-studio/reports/Cobalt_Engineering_Report.docx)

## CI, artifacts, and pull requests

The existing `ci.yml` is reusable by the release workflow and runs on PRs and pushes to `main`. Its **CI verification** job has named steps for locked dependency installation, workflow contracts, TypeScript, meaningful unit/release tests, privacy/content checks, both production bases, Chromium installation, browser tests, and built-path/report verification. Success uploads `cobalt-production-builds-<attempt>` for 14 days. `cobalt-test-results-<attempt>` retains unit/browser reports, screenshots, and available failure traces for 7 days, including failing runs. Attempt-specific names prevent reruns from replacing an immutable artifact. The output lists are explicit; dependencies, credential files, and the full checkout are excluded. Artifact retention is temporary and subject to repository limits. [GitHub retention documentation](https://docs.github.com/en/actions/tutorials/store-and-share-data)

Actions use immutable commits verified against their official repositories. CI uses read access; Pages deploy receives Pages write and OIDC permissions only in its deployment job; release publication receives contents write only after verification. Dependabot checks npm and GitHub Actions dependencies and its PRs receive the same relevant CI. No additional paid service or infrastructure is introduced.

Feature branch publication and the substantive PR are approved. The [PR template](../.github/pull_request_template.md) asks for the problem, resulting behavior, actual validation, and publication impact. [DevOps handoff](DEVOPS_HANDOFF.md) identifies the reviewed scope and pending actual PR/CI links. Read-only repository inspection verified that `main` is unprotected and has no active branch rules. Recommend requiring **CI verification**, a current branch, and review before merging; this document does not claim those protections are enabled. Enabling repository rules requires separate authorization. [GitHub required-check documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

Production builds use the approved public repository HTTPS URL. The local revision also places a GitHub repository link beside the developer credit across the application. The Netlify badge displayed on the primary site is provider-injected UI and was inspected separately; it has no source/build counterpart.

The Netlify site uses a repository-scoped, read-only deploy key and a push webhook. Anonymous access was enabled on the new site after its initial protected response. Global Git identity, team defaults, billing, and the Free plan were not changed; automatic top-up remains disabled.

## Published release

The [v0.1.0 GitHub Release](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/releases/tag/v0.1.0) was created by the [tag-triggered workflow](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38331500958) after the production checks passed. The annotated tag points to commit `3b556c6d509b39301549af2e0ee2ade69d4495c5`; the [tagged source tree](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/tree/v0.1.0) provides that reviewed version.

The release workflow passed 32 unit tests and 7 browser tests, verified the package/tag version, and created exactly one release with two report attachments. Reviewed notes matched the published notes. Historical anonymous PDF/DOCX attachment downloads matched the tagged report bytes. [Release validation](release-validation.json) records the result; no duplicate manual release was created.

For future versions, review production and CI results before pushing the annotated version tag, let the workflow create the release, and verify its notes and downloads. Repository-local commits use the approved developer attribution and a GitHub noreply address; global Git identity remains unchanged. No project license has been selected; dependency licenses remain applicable.

The new release implementation is prepared locally for a future approved version. Preflight verifies an existing annotated tag and agreement with `package.json`, `CHANGELOG.md`, release notes, and report metadata. Reusable CI must succeed. Packaging consumes the tested production artifact by the exact artifact ID returned from that same run; it checks both report copies and uses those reports rather than unrelated checkout files. Prepared attachments are also retained as `cobalt-release-attachments-<attempt>` for 30 days.

The future Release will attach `Cobalt_Engineering_Report.pdf`, `Cobalt_Engineering_Report.docx`, `Cobalt_Static_Build_vX.Y.Z.tar.gz`, `release-manifest.json`, and `SHA256SUMS.txt`. The archive contains only tested `dist` and `dist-pages`; the manifest records the source commit and per-file static hashes. `SHA256SUMS.txt` covers the other four assets; the notes also include the checksum file's own SHA-256 and the successful verification run. Uploads are checked and downloaded bytes compared before a draft is published. An already published Release is left unchanged; an existing draft stops for review. Network or API errors are failures, not evidence that a Release is absent.

For local inspection, `node scripts/record-build-verification.mjs .local/build-verification.json` records completed checks and file hashes with a local execution context. `node scripts/package-release.mjs <tested-artifact-directory> <empty-output-directory>` prepares attachments with `RELEASE_TAG` and `GITHUB_SHA` set to the reviewed version/commit. This local dry run cannot establish GitHub execution: the publisher and Pages verifier require CI-context evidence. The workflow uses `node scripts/verify-build-verification.mjs <downloaded-artifact-directory> --expected-commit <sha>` to verify downloaded files before publication.

The completed local dry run verified 18 input-file hashes and five attachments; extracting the static archive preserved all 14 packaged static-file hashes. [Local DevOps evidence](devops-local-validation.json) records the result. This packaging result does not describe a new public Release: the existing initial assets remain unchanged and a new version remains unselected.

The existing annotated `v0.1.0` already exists and must not be recreated, moved, or supplemented with new assets. Its two reports remain historical. A new release requires a deliberately selected new semantic version and matching package, changelog, notes, and reports before tagging. This local revision selects no new version and creates no new tag or Release.

## Hosting limits

Provider permissions, quotas, and plan rules can change. Netlify usage or credit exhaustion can interrupt hosting; review the account's actual limits during future changes. Neither provider's future uptime is guaranteed. No 30-day availability measurement has been performed.

## Final manual cellular check

1. Open the [Netlify production URL](https://cobalt-instrument-studio.netlify.app/) on a phone using cellular data, with Wi-Fi disabled.
2. Confirm six instruments, the developer credit, and the simulated-data notice appear, then start and pause the engine.
3. Run coolant overheat and inspect its warning/critical transition in Diagnostics.
4. Run communication loss, confirm stale values, and wait for automatic recovery.
5. Download the PDF and DOCX; repeat basic access on the [Pages backup](https://cloudwizardboricua.github.io/cobalt-instrument-studio/).

This physical cellular-network check remains a manual follow-up; browser viewport tests do not establish cellular reception.

## Workflow references

The Pages workflow follows [GitHub's official custom workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages). Release creation uses an existing tag and a notes file as documented in the [GitHub CLI release manual](https://cli.github.com/manual/gh_release_create). Actual remote run links above provide the observed CI and Pages results.
