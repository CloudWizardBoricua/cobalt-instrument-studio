# Repository and pull-request audit

Read-only observations collected October 27, 2026, before repository polishing. Baseline: `cb2297e750e5bc2acdd02b089874997ca3078667`. The later local implementation is on `docs/demo-repository-polish`; its test/build results belong in [demo validation](DEMO_VALIDATION.md).

## Synchronization and intended work

The initial desktop checkout was clean on `main`. Local HEAD and `origin/main` matched the GitHub connector's freshly fetched default-branch commit, `cb2297e750e5bc2acdd02b089874997ca3078667`, with **zero commits ahead and zero behind**. The connector's compare operation also returned `identical`. CLI remote lookup failed with a network name-resolution/thread error; fresh connector reads supplied independent remote evidence.

GitHub branch search was paginated to completion: 18 live branches, including main, seven retained product/docs/fix branches, and ten dependency branches. Local ancestry checks showed every retained product/docs/fix branch already contained in main:

```text
Already included in main                Unmerged proposals
docs/hmi-production-roadmap             4 GitHub Actions updates
docs/readme-device-workspace            6 npm/tooling updates
feat/device-pages-and-evidence
feat/telemetry-devops-hardening
feat/v020-publication-receipts
fix/device-workspace-open
fix/top-simulation-controls
```

Each dependency branch contains one commit outside main. Thus **synchronized with GitHub's default branch does not mean every proposed dependency change is included**. All visible merged application/documentation work is present. The audit cannot determine whether unpushed work remains on the laptop.

The repository has seven merged PRs and ten open PRs at this observation. No PR was merged, updated, superseded, closed, or commented on during the audit. Recommendations below require a later user decision.

## Open PR recommendations

All ten open PRs were inspected through metadata, actual per-file patches, review submissions, inline review threads and associated Actions runs. They have **zero submitted reviews and zero inline review threads**. All report `mergeable=true`, meaning no detected textual merge conflict. #2–#10 report `mergeable_state=behind`: each misses 12 main commits and its last successful/failed run is against an older baseline. #17 reports `clean` against current main. Mergeability and dependency compatibility are separate questions.

| PR | Proposed change and inspected files | Latest observed PR CI | Recommendation and reason |
| --- | --- | --- | --- |
| [#2](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/pull/2) | upload-pages-artifact 4→5; Pages workflow only | [Success, 38346226571](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38346226571) | **Update and review separately.** Preserves immutable references and gates. PR CI does not run the changed Pages upload action; require deployment-specific compatibility review and hosted evidence. |
| [#3](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/pull/3) | configure-pages 5→6; Pages workflow only | [Success, 38346221249](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38346221249) | **Update and review separately.** Green application CI does not exercise this configuration action. Confirm existing project-base and environment behavior. |
| [#4](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/pull/4) | deploy-pages 4→5; Pages workflow only | [Success, 38346226872](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38346226872) | **Update and review separately.** Actual production execution of the replacement deploy action remains unproven by PR CI. |
| [#5](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/pull/5) | checkout 6→7; all three workflows | [Success, 38346223798](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38346223798) | **Update/retest, then consider a maintenance merge.** The changed checkout executed in CI. Full SHA pins and disabled credential persistence remain. |
| [#6](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/pull/6) | TypeScript 5.9.3→7.0.2; package and lockfile | [Success, 38346243551](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38346243551) | **Update and validate on Windows separately.** A compiler major migration adds 20 optional platform compiler packages. Linux success does not establish desktop installation/compiler behavior. |
| [#7](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/pull/7) | lucide-react 0.468→1.54; package and lockfile | [Success, 38346249389](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38346249389) | **Update/retest, inspect icons, then consider a maintenance merge.** The diff's peer metadata supports React 19. Visual changes should be reviewed before the demo. |
| [#8](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/pull/8) | Node types 24→26; package and lockfile | [Success, 38346253970](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38346253970) | **Close or supersede with Node-24-aligned types**, unless a runtime migration is chosen. CI and Netlify deliberately target Node 24. |
| [#9](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/pull/9) | plugin-react 5→6; package and lockfile | [Failure, 38346254126](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38346254126) | **Supersede with a coordinated build-tool migration.** Job logs show `ERESOLVE`: plugin-react 6 requires Vite 8 while this branch retains Vite 7. Do not force the install. |
| [#10](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/pull/10) | Vite 7→8; package and lockfile | [Failure, 38346266850](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38346266850) | **Supersede/update together with #9 after test-tool review.** Logs show TS2769 in `vite.config.ts`: root Vite 8/Rolldown plugin types conflict with Vitest 3's nested Vite 7/Rollup types. |
| [#17](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/pull/17) | Title names @vitest/mocker 3→5; actual package diff upgrades **Vitest 3.2.7→5.0.5** and related lockfile graph | [Success, 40376706570](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/40376706570) | **Prioritize a separate tooling/security review; consider merge after Windows and report compatibility validation.** Removes tinypool and changes assertion/mocking dependencies. Linux logs prove 100 unit and 17 browser tests, both builds and static checks passed; the title understates scope. |

Immutable heads inspected:

```text
#2  cb722219f81908462a2e74f2695d85f7818ac38f
#3  ebb7103f5740097a91b1c85850852c1d719e433a
#4  277406a67419f71de8bdb2de65a16a3a7b8d4e80
#5  ef289ddd95fe9e4263ac69577797fc0b9c40ac4e
#6  f397d15396bcd761985f29dbd750c8c2a31a01c9
#7  0678f583e71e2ce5aab21da089d980f235fa8943
#8  95d5b75a3443d88bca7a04f702851ba0dbfa50bb
#9  5202c2cb7510cb7f49dffe1b4767d4f18c0af176
#10 8b0ac737276212262b5ce2c79b0492270195f267
#17 8ef8db9d55f61d3ef8e2d713250cf1c6ad8700c5
```

Suggested order: keep the behavior-preserving cleanup independent; review #17 first for the known development-tool concerns, then coordinate #9/#10 against the selected test stack. Refresh all affected lockfiles and rerun required checks after each accepted merge. Checkout, icons and compiler maintenance have no required order relative to one another. Review the Pages configure→upload→deploy chain together, or validate hosted behavior after each separately approved action update. That is a review sequence, not proof that the major versions require one another. Close superseded requests only once replacement scope is explicit.

## Merged work already present

All seven merged PR heads/merge commits are reachable from main. Review-submission lists for #11–#16 are empty; successful CI is evidence of automated execution, not human approval. The historical #1 description and retained branch were also inspected; its current metadata confirms the merge.

| PR | Scope and changed-file count | Merge commit | Final observed PR CI |
| --- | --- | --- | --- |
| [#1](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/pull/1) | Telemetry boundary, device workspace and publication hardening; 64 files | `453ea4a` | [Success, 38341235636](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38341235636) |
| [#11](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/pull/11) | Zero standby presentation, five device pages, v0.2.0 reports/evidence; 55 files | `5e7615a` | [Success, 38345775927](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38345775927) |
| [#12](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/pull/12) | Publication receipt/documentation updates; 11 files | `b30df73` | [Success, 38347255801](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38347255801) |
| [#13](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/pull/13) | Default-open workspace and disclosure-state/static/browser checks; 6 files | `e482c76` | [Success, 38348699126](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38348699126) |
| [#14](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/pull/14) | README workspace image; 2 files | `db35677` | [Success, 38349537747](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38349537747) |
| [#15](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/pull/15) | Top Start/Pause/Reset controls and mobile layout; 5 files | `b92b1f7` | [Success, 38417672530](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38417672530) |
| [#16](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/pull/16) | Proposed production-HMI architecture and roadmap; 3 Markdown files | `cb2297e` | [Success, 40237377664](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/40237377664) |

#1 and #11–#15 merged October 13; #16 merged October 25, 2026. Their retained branch names are not evidence of outstanding feature work.

## Deployment evidence and protected contracts

Fresh GitHub reads confirm [main CI 40237618134](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/40237618134) succeeded on `cb2297e`, with **100 unit tests in eight files and 17 browser tests** in its actual job logs. [Pages run 40238102350](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/40238102350) also succeeded on that exact source. Its jobs passed exact-source checkout, exact upstream run/attempt artifact download, source/file hash verification, the current-main gate, Pages artifact upload and deployment. These are confirmed hosted executions for the baseline, not for the later local cleanup branch.

| Host | Build/configuration contract | Routing and assets |
| --- | --- | --- |
| [Netlify](https://cobalt-instrument-studio.netlify.app/) | Node 24; `npm run build`; publish `dist`; base `/`; repository integration rebuilds main independently | One HTML entry and React view state. Existing security/cache headers stay in `netlify.toml`; no rewrite required. |
| [GitHub Pages](https://cloudwizardboricua.github.io/cobalt-instrument-studio/) | `npm run build:pages`; `dist-pages`; base `/cobalt-instrument-studio/`; deployment consumes successful same-repository main-push CI artifact without rebuilding | Base-relative favicon/assets/report links. No pathname router or deep-link fallback is required. |

Both hosts retain `reports/Cobalt_Engineering_Report.pdf` and `.docx`. `VITE_BASE_PATH` and `VITE_SOURCE_URL` are public build-time values, not secret storage. Report synchronization, script entry paths, workflow locations and package scripts remain deployment-sensitive. Added public READMEs become additional static documentation files; they do not rename existing URLs. See [deployment guide](DEPLOYMENT.md) and [current local validation](DEMO_VALIDATION.md).

Access and interpretation limits:

- Current branch protection could not be read: GitHub returned **403, Resource not accessible by integration**. Historical protection records remain historical; this audit does not reconfirm their current settings.
- The legacy commit-status endpoint has zero statuses and reports `pending`. Check-run/workflow endpoints independently confirm successful CI; an empty legacy status list is not a failing check.
- No Netlify connector/provider session was available to establish its current deployed source SHA, build log or account settings. Existing Netlify deployment receipts refer to older verified checkpoints. Public reachability and local builds cannot establish the provider's current source revision.
- No PR update/merge, push, deployment, tag, Release or provider-configuration change was performed. This branch has no confirmed hosted deployment. Browser and HTTP observations, if collected during polishing, are described separately in [demo validation](DEMO_VALIDATION.md) and [demo usability](DEMO_USABILITY.md).

## Plugin contribution and next reading

GitHub supplied fresh branch/PR/diff/review/job-log evidence. Context7 supplies version-matched framework guidance for the cleanup; its indexed-version limit is disclosed in [validation](DEMO_VALIDATION.md). Product Design reviews the actual demo flow with fresh screenshots in [demo usability](DEMO_USABILITY.md). Codex Security examines actual simulator and automation trust boundaries in [security review](SECURITY_REVIEW.md). Neither a code audit nor simulator tests establish real-equipment safety or hardware integration.

Continue with the [polishing plan and rename map](DEMO_POLISH_PLAN.md), [test relevance assessment](TEST_RELEVANCE.md), or [documentation index](README.md). [OPEN_PR_REVIEW.md](OPEN_PR_REVIEW.md) and its JSON are preserved earlier release-time reviews; the table above is the later observation.
