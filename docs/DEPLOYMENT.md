# Hosting and DevOps verification

For the October 27, 2026 repository-polishing sprint, read the [fresh repository/PR audit](REPOSITORY_AUDIT.md) and [current local validation](DEMO_VALIDATION.md). The release and provider receipts below describe their recorded historical checkpoints. They do not establish deployment of the local cleanup branch or the current Netlify source revision.

_Developed by Daren Diaz_ · [GitHub repository](https://github.com/CloudWizardBoricua/cobalt-instrument-studio)

Fall 2026

**Current published version 0.2.0:** [PR #11](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/pull/11) merged main `5e7615a98478ae14301da4377c9e6a2255cd2139`. Its [final PR CI](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38345775927) and [main CI](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38346046807) succeeded with 100 unit and 17 Linux Chromium browser tests. [Pages](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38346244271) deployed the exact tested main output; [Netlify production](https://app.netlify.com/sites/cobalt-instrument-studio/deploys/6acdb1c6ed38ff1edec513e4) is ready at the same source. The new annotated tag workflow succeeded and its five Release attachments passed inspection. The existing v0.1.0 tag/Release is preserved.

Final local version 0.2.0 checks passed 100 unit and 17 browser tests, including standby, typography and 30 device-page/theme/width combinations, with zero JavaScript errors. Both reports passed visual inspection of all nine pages and metadata/repository-link checks. Both local builds passed 12 check groups each with matching 459,765-byte PDF and 554,147-byte DOCX downloads. The report/source checkpoint stays frozen; actual later CI and production receipts are separate. [Local validation](validation-evidence.json), [hosting builds](hosting-build-validation.json), and [actual production bytes](v020-production-validation.json)

Version 0.2.0 is publicly hosted at two independent HTTPS endpoints. Both serve static assets and run the simulation inside the visitor's browser; the development computer does not need to remain powered on.

## Verified endpoints

| Endpoint          | URL                                                                                                                     | Role                                 |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Netlify           | [cobalt-instrument-studio.netlify.app](https://cobalt-instrument-studio.netlify.app/)                                   | Primary shareable demo               |
| GitHub Pages      | [cloudwizardboricua.github.io/cobalt-instrument-studio](https://cloudwizardboricua.github.io/cobalt-instrument-studio/) | Independent backup                   |
| GitHub repository | [CloudWizardBoricua/cobalt-instrument-studio](https://github.com/CloudWizardBoricua/cobalt-instrument-studio)           | Public source; default branch `main` |

Current [production HTTP/deployment checks](v020-production-validation.json) verify both provider source commits, entries, four built assets per origin, and direct report downloads. PDF and DOCX bytes match the visually reviewed files on both hosts. Netlify's provider-injected interface script is recorded separately from repository-built assets. These checks establish observed access and byte identity, not future availability.

[Current public Edge checks](v020-production-browser.json) passed **17/17 tests per origin**: standby/start/pause/reset, all five scenarios, rejection/timeout/recovery, acknowledgment, device pages/properties/history, preferences, CSV, report links and keyboard/reduced-motion behavior. Each origin covered 30 device-page/theme/width and 18 application combinations with no JavaScript errors. Tests used isolated contexts, controlled-clock scenario paths and a separate real-clock smoke. Observed wall times were 44.458 s on Netlify and 47.480 s on Pages; these are measurements of the test runs, not performance guarantees.

## Historical production checkpoints

The initial [public browser validation](public-browser-validation.json) and [public HTTP validation](public-http-validation.json) record the earlier six-instrument, three-scenario build. Its anonymous downloads matched the then-current artifacts, mobile views fit a 390 px viewport, and observed error-level logs were empty. These records are historical.

Prior read-only verification recorded the published baseline at commit `421ea725f9be740f86d7b61e445e37e18a1f4d0b`: [CI succeeded](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38333357919) with 32 unit tests and 7 Chromium browser tests; the [Pages deployment succeeded](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38333358441), and [Netlify was ready](https://app.netlify.com/sites/cobalt-instrument-studio/deploys/6acd8c5cd6fa3bd467203c8f). At that checkpoint, anonymous HTTPS checks returned 200 for both entries, referenced assets, and direct reports. Report hashes matched the unchanged initial release.

At that older checkpoint, real-clock browser checks passed 10 check groups on each production site: six instruments, telemetry/pause/reset, operating modes/keyboard targets, the three then-published scenarios including acknowledgment and timeout/recovery, mobile views, preferences, report links, and no browser errors. [Remote workflow baseline](workflow-remote-baseline.json) retains those historical observations without claiming the newer hardening was deployed then.

The [earlier PR #1 production HTTP/deployment record](workflow-production-validation.json) verifies main `453ea4a126fab0a44f4345871b401a5c11fbce86`. Its [production browser checks](workflow-production-browser.json) passed 12/12 tests per origin, covering five scenarios, invalid-sample protection/recovery, oil-pressure escalation, device properties, controls, and 18 application combinations. This record describes the earlier six-slot workspace before the five cockpit pages. Historical evidence is retained without rewriting its source or counts.

## Build and deployment paths

`npm run build` creates Netlify-compatible root assets in `dist`. Netlify's existing repository integration builds `main` with that command and publishes `dist`. `npm run build:pages` creates project-relative assets in `dist-pages` with base `/cobalt-instrument-studio/`. Each build includes `reports/Cobalt_Engineering_Report.pdf` and its DOCX counterpart. Navigation changes local view state, so no app routes or rewrites are required.

The improved Pages workflow on `main` waits for a completed successful **Continuous integration** run whose event is a push to this repository's `main`. It downloads `cobalt-production-builds-<attempt>` from that exact upstream run and attempt, validates the source/build evidence, and deploys its tested `dist-pages` output without rebuilding. It also skips a completed source revision that is no longer the current `main`. A failed, canceled, PR, fork, or other-branch CI run cannot authorize Pages publication. The direct manual trigger is removed so it cannot bypass this verification gate. [Pages run 38346244271](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38346244271) successfully executed this path for version 0.2.0. Netlify builds main through its existing integration and is not claimed to be CI-gated.

After authorized publication, inspect the successful main CI and Pages run links, both production entries and every referenced asset. Exercise Start/Pause/Reset, mode and speed/load controls, all five scenarios, rejection/timeout/recovery, acknowledgment, and the device workspace at desktop/mobile widths. Download each report directly from both origins and compare its SHA-256 to the reviewed version. Record results against the published commit; a status badge or HTTP 200 alone does not prove those behaviors.

- Netlify reports: [PDF](https://cobalt-instrument-studio.netlify.app/reports/Cobalt_Engineering_Report.pdf) · [DOCX](https://cobalt-instrument-studio.netlify.app/reports/Cobalt_Engineering_Report.docx)
- Pages reports: [PDF](https://cloudwizardboricua.github.io/cobalt-instrument-studio/reports/Cobalt_Engineering_Report.pdf) · [DOCX](https://cloudwizardboricua.github.io/cobalt-instrument-studio/reports/Cobalt_Engineering_Report.docx)

## CI, artifacts, and pull requests

The existing `ci.yml` is reusable by the release workflow and runs on PRs and pushes to `main`. Its **CI verification** job has named steps for locked dependency installation, workflow contracts, TypeScript, meaningful unit/release tests, privacy/content checks, both production bases, Chromium installation, browser tests, and built-path/report verification. Success uploads `cobalt-production-builds-<attempt>` for 14 days. `cobalt-test-results-<attempt>` retains unit/browser reports, screenshots, and available failure traces for 7 days, including failing runs. Attempt-specific names prevent reruns from replacing an immutable artifact. The output lists are explicit; dependencies, credential files, and the full checkout are excluded. Artifact retention is temporary and subject to repository limits. [GitHub retention documentation](https://docs.github.com/en/actions/tutorials/store-and-share-data)

Actions use immutable commits verified against their official repositories. CI uses read access; Pages deploy receives Pages write and OIDC permissions only in its deployment job; release publication receives contents write only after verification. Dependabot checks npm and GitHub Actions dependencies and its PRs receive the same relevant CI. No additional paid service or infrastructure is introduced.

[PR #11](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/pull/11) is the substantive version 0.2.0 review. [Final PR artifact inspection](v020-pr-final-validation.json) and [actual main inspection](v020-main-ci-validation.json) confirm 100 unit and 17 Linux Chromium browser tests, source-bound builds, report bytes, twelve screenshots, observed retention and clean selected JSON reports. [Inspected main production artifact](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38346046807/artifacts/11789480222) requires GitHub sign-in and has temporary 14-day retention. The [earlier PR #1 artifact inspection](workflow-pr-validation.json) retains its 92/12 historical result. The [PR template](../.github/pull_request_template.md) asks for the problem, resulting behavior, actual validation, and publication impact. [DevOps handoff](DEVOPS_HANDOFF.md) records scope and evidence.

Protection for `main` is [enabled and verified](workflow-governance-validation.json): PRs and strict **CI verification** from GitHub Actions are required; administrator enforcement is on, force pushes/deletions are blocked, and conversations must be resolved. The required reviewer approval count is zero. This current state supersedes the retained older unprotected baseline. [GitHub required-check documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

Earlier inspection found automatic Git contact metadata in temporary Playwright test artifacts, despite passing test results. Both affected artifacts were removed with approval and deletion verified; production artifacts were retained. The [governance record](workflow-governance-validation.json) suppresses contact values and records cleanup. Version 0.2.0 disables automatic Git capture and sanitizes reports before upload, including failed runs. Downloaded final PR/main reports passed privacy inspection without Git contact metadata, tokens or private Windows user paths. This correction does not rewrite the historical finding.

Production builds use the approved public repository HTTPS URL, with a GitHub link beside developer credit across the application. The Netlify badge displayed on the primary site is provider-injected UI and was inspected separately; it has no source/build counterpart.

The Netlify site uses a repository-scoped, read-only deploy key and a push webhook. Anonymous access was enabled on the new site after its initial protected response. Global Git identity, team defaults, billing, and the Free plan were not changed; automatic top-up remains disabled.

## Verified version 0.2.0 Release

The [annotated v0.2.0 tag](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/tree/v0.2.0) points to verified main `5e7615a98478ae14301da4377c9e6a2255cd2139`. Its [release run 38346481631](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38346481631) passed all three jobs and published exactly one nondraft, nonprerelease [v0.2.0 Release](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/releases/tag/v0.2.0). [Release inspection](v020-release-validation.json) verified notes against tagged source, all five downloaded attachment hashes, the manifest's source and checks, and every static archive file. Both embedded reports match the reviewed reports, attachments and production downloads.

| Verified download | Inspected result |
| --- | --- |
| [PDF](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/releases/download/v0.2.0/Cobalt_Engineering_Report.pdf) | 459,765 bytes; same SHA-256 on both hosting origins |
| [DOCX](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/releases/download/v0.2.0/Cobalt_Engineering_Report.docx) | 554,147 bytes; same SHA-256 on both hosting origins |
| [Static build archive](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/releases/download/v0.2.0/Cobalt_Static_Build_v0.2.0.tar.gz) | 2,257,932 bytes; all 14 tested files verified for both bases |
| [Release manifest](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/releases/download/v0.2.0/release-manifest.json) | Tagged GitHub Actions source commit and per-file static hashes |
| [SHA256SUMS.txt](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/releases/download/v0.2.0/SHA256SUMS.txt) | Matches the four covered attachments; published notes also contain its own digest |

## Historical initial release

The [v0.1.0 GitHub Release](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/releases/tag/v0.1.0) was created by the [tag-triggered workflow](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38331500958) after the production checks passed. The annotated tag points to commit `3b556c6d509b39301549af2e0ee2ade69d4495c5`; the [tagged source tree](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/tree/v0.1.0) provides that reviewed version.

The release workflow passed 32 unit tests and 7 browser tests, verified the package/tag version, and created exactly one release with two report attachments. Reviewed notes matched the published notes. Historical anonymous PDF/DOCX attachment downloads matched the tagged report bytes. [Release validation](release-validation.json) records the result; no duplicate manual release was created.

For future versions, review production and CI results before pushing the annotated version tag, let the workflow create the release, and verify its notes and downloads. Repository-local commits use the approved developer attribution and a GitHub noreply address; global Git identity remains unchanged. No project license has been selected; dependency licenses remain applicable.

## Release packaging and future verification

The enhanced release implementation verifies a new annotated tag and agreement with `package.json`, `CHANGELOG.md`, release notes, and report metadata. Reusable CI must succeed. Packaging consumes the tested production artifact by the exact artifact ID returned from that same run; it checks both report copies and uses those reports rather than unrelated checkout files. Prepared attachments are retained as `cobalt-release-attachments-<attempt>` for 30 days.

The configured Release attaches `Cobalt_Engineering_Report.pdf`, `Cobalt_Engineering_Report.docx`, `Cobalt_Static_Build_vX.Y.Z.tar.gz`, `release-manifest.json`, and `SHA256SUMS.txt`. The archive contains only tested `dist` and `dist-pages`; the manifest records the source commit and per-file static hashes. `SHA256SUMS.txt` covers the other four assets; the notes also include the checksum file's own SHA-256 and the successful verification run. Uploads are checked and downloaded bytes compared before a draft is published. An already published Release is left unchanged; an existing draft stops for review. Network or API errors are failures, not evidence that a Release is absent.

For local inspection, `node scripts/record-build-verification.mjs .local/build-verification.json` records completed checks and file hashes with a local execution context. `node scripts/package-release.mjs <tested-artifact-directory> <empty-output-directory>` prepares attachments with `RELEASE_TAG` and `GITHUB_SHA` set to the reviewed version/commit. This local dry run cannot establish GitHub execution: the publisher and Pages verifier require CI-context evidence. The workflow uses `node scripts/verify-build-verification.mjs <downloaded-artifact-directory> --expected-commit <sha>` to verify downloaded files before publication.

The earlier local dry run verified 18 input-file hashes and five attachments using the version 0.1.0 format solely for inspection. [Local DevOps evidence](devops-local-validation.json) retains that historical result. Actual version 0.2.0 tag-workflow completion and attachment inspection are verified separately above. Initial release assets remain unchanged.

The existing annotated `v0.1.0` must not be recreated, moved, or supplemented with new assets. Its two reports remain historical. Version 0.2.0 PR/main CI, both public deployments, the annotated tag and the published Release are verified. PDF/DOCX and shared source preserve the local report checkpoint, with later remote receipts in separate Markdown/evidence files. Receipt-only documentation changes use their own protected PR and CI.

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
