# DevOps verification and publication handoff

_Developed by Daren Diaz_ · [GitHub repository](https://github.com/CloudWizardBoricua/cobalt-instrument-studio)

Fall 2026 · Version 0.2.0

Version 0.2.0 is merged through [PR #11](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/pull/11) at main `5e7615a98478ae14301da4377c9e6a2255cd2139` and deployed to both hosts. Final PR/main CI passed 100 unit and 17 Linux Chromium browser tests; both public sites passed 17 browser tests. The five blue cockpit pages, standby lifecycle, evidence privacy correction, and reviewed report bytes are verified. The annotated v0.2.0 workflow succeeded, published one Release and passed downloaded five-asset/archive inspection. Existing v0.1.0 is preserved.

## Reviewed scope

- Preserve the simulator while adding accepted-sample validation, two fault/recovery scenarios, a device preview/signal browser/property editor, accessible state cues, neutral Design concept branding, and adjacent developer/repository credit.
- Improve the three existing GitHub workflows. CI uses the lockfile and named steps, produces both tested static bases, and preserves selected test reports, screenshots, and failure traces.
- Gate Pages on a successful main CI run and consume its exact tested artifact. Keep Netlify as primary and Pages as backup.
- Reuse CI for releases, require annotated tag/version agreement, package tested outputs, generate SHA-256 evidence, and verify attachments before publishing one Release. Preserve the existing initial release.
- Pin official actions to verified immutable commits, scope token permissions per job, configure npm/Actions Dependabot, and explain lifecycle and local reproduction in README.

## Actual version 0.2.0 execution

| Verified step | Receipt |
| --- | --- |
| Substantive review | [PR #11](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/pull/11), merged at `5e7615a98478ae14301da4377c9e6a2255cd2139` |
| Final PR CI | [Successful run 38345775927](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38345775927); [100/17 tests and artifact inspection](v020-pr-final-validation.json) |
| Main CI | [Successful run 38346046807](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38346046807); [actual merge and source-bound artifact inspection](v020-main-ci-validation.json) |
| GitHub Pages | [Successful run 38346244271](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38346244271), consuming the exact tested main output |
| Netlify | [Ready deployment 6acdb1c6ed38ff1edec513e4](https://app.netlify.com/sites/cobalt-instrument-studio/deploys/6acdb1c6ed38ff1edec513e4) at the same source commit |
| Production bytes | [Both origins and direct report hashes](v020-production-validation.json), including four built assets per site |
| Production browser | [17/17 tests per origin](v020-production-browser.json), 30 device and 18 application combinations per site, no JavaScript errors |
| Tagged Release | [Successful run 38346481631](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38346481631); [published v0.2.0](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/releases/tag/v0.2.0) and [five downloaded assets/archive checks](v020-release-validation.json) |

The final reviewed branch head was `47caa1a2756bb7fe087229c7048dbdf45296b8a5`. CI tested PR merge revision `0870e640ab619df35f4a77840c5da133892fee64`; its tree matches the actual main merge. The final PR and main artifact inspections verified ZIP digests, source/file inventories, exact PDF/DOCX copies, observed 14-day production and 7-day test retention, and selected JSON privacy. Twelve captured screenshots include six cockpit pages/states. Passing runs produced no failure traces. [Inspected main production artifact](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38346046807/artifacts/11789480222)

Public checks used installed Edge, isolated contexts, controlled clocks for guided scenarios and a separate real-clock smoke. Netlify's observed wall time was 44.458 s and Pages' 47.480 s. These are test-run observations, not performance guarantees. Both sites passed standby/start/pause/reset, all five scenarios, device navigation/properties, shared ACK, accepted-history retention, mobile/theme/focus/reduced-motion behavior and downloads. Netlify's provider-injected interface script is recorded separately from repository-built assets.

## Earlier PR and production checkpoint

The [PR execution record](workflow-pr-validation.json) verifies branch head `27cfdd078a1e961061a047e83593d4f87b361230` and tested merge `c8a58613e67e1c64a276496ff64d4c0a6d8cc8db`; the tested tree matches actual merge `453ea4a126fab0a44f4345871b401a5c11fbce86`. Downloaded evidence confirms **92/92 unit tests, 12/12 Linux Chromium browser tests**, 18 layout/focus/reduced-motion combinations, both static bases, and six authentic screenshots. Production artifact `cobalt-production-builds-1` had its ZIP digest and source/file hashes verified, with observed 14-day retention. [Retained production artifact](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38341235636/artifacts/11786956557)

[Earlier production HTTP/deployment verification](workflow-production-validation.json) confirms the `453ea4a126fab0a44f4345871b401a5c11fbce86` checkpoint. Its [production browser verification](workflow-production-browser.json) passed 12/12 checks on each site using installed Edge: controlled-clock scenario paths plus a real-clock smoke. Measured wall times were 35.158 s on Netlify and 31.163 s on Pages, with 18 view/theme/width combinations per site. Those historical measurements do not describe version 0.2.0.

## Artifact privacy finding and repository governance

The original temporary test artifact included automatically captured Git author/committer contact metadata. Test execution succeeded, but this content inspection had a finding. With explicit approval, both affected temporary test artifacts were deleted and their absence verified; production artifacts were retained. Contact values are omitted from authored evidence. Version 0.2.0 disables automatic Git capture and sanitizes reports before upload, including failed runs. Downloaded final PR/main reports passed inspection without Git contact metadata, tokens, or private Windows user paths. [Governance and cleanup evidence](workflow-governance-validation.json) and [current inspected test evidence](v020-main-ci-validation.json)

`main` protection is now enabled and verified: a PR and strict **CI verification** from GitHub Actions are required, administrator enforcement is enabled, force pushes/deletions are blocked, and conversations must be resolved. Required reviewer approvals are zero. This actual state supersedes the historical unprotected baseline without rewriting that record.

## Historical baseline

The [read-only remote baseline](workflow-remote-baseline.json) verifies the earlier published source at commit `421ea725f9be740f86d7b61e445e37e18a1f4d0b`. Its [CI run](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38333357919) passed 32 unit tests and 7 browser tests, and its [Pages run](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38333358441) succeeded. Netlify was ready at that checkpoint. Real-clock production-browser observations passed 10 check groups per site; direct assets/reports returned 200 and report hashes matched the unchanged initial release. These historical results concern the three-scenario baseline and old workflows.

## Earlier local DevOps checkpoint

| Check | Observed result |
| --- | --- |
| Clean isolated `npm ci` | Passed with the unchanged committed lockfile; 150 packages, 25 s |
| `npm run verify:workflows` | Passed for the three existing workflows |
| Actionlint 1.7.12 | No core diagnostics; optional ShellCheck and Pyflakes unavailable |
| `npm run typecheck` | Passed |
| `npm run test:ci` | 92/92 tests across six files, 3.56 s |
| `npm run test:e2e` | 12/12 tests, 41.7 s; installed Edge, reused local production preview |
| `npm run build` and `npm run build:pages` | Both passed |
| `npm run verify:static -- --skip-build` | Both bases passed 12 check groups each; exact report hashes |
| `npm run verify:privacy` | 87 text files passed privacy/content checks |
| Local release archive packaging | Passed: 18 input-file hashes checked, five attachments verified, all 14 static-file hashes preserved through archive extraction |

Failure screenshots use `only-on-failure`; traces use `retain-on-failure`. These are capture policies, not a claim that a failing browser case occurred. The earlier engineering report recorded its **58 unit/12 browser** hardening checkpoint; [local DevOps evidence](devops-local-validation.json) separately records the later 92-test checkpoint above. The [successful PR CI run](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38341235636) establishes that earlier GitHub execution. Current version 0.2.0 report counts come from new local evidence.

The earlier ignored `.local/devops-release-dry-run` output inspected five attachments using version 0.1.0 only as a local packaging format. It created or replaced no tag, Release, or public asset. That historical archive result does not establish the approved new version 0.2.0 package or its future GitHub execution.

## Verified tag workflow and Release

The [annotated v0.2.0 tag](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/tree/v0.2.0) points to verified main `5e7615a98478ae14301da4377c9e6a2255cd2139`. Its [tag-triggered release run](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38346481631) passed all three jobs: version/tag preflight, reusable CI and verified publication. [Release inspection](v020-release-validation.json) confirmed exactly one nondraft, nonprerelease [v0.2.0 Release](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/releases/tag/v0.2.0), notes matching tagged source, all five downloaded attachment hashes and every one of the archive's 14 files. Embedded reports match the reviewed attachments and both hosting sites.

- [Engineering PDF](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/releases/download/v0.2.0/Cobalt_Engineering_Report.pdf)
- [Editable DOCX](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/releases/download/v0.2.0/Cobalt_Engineering_Report.docx)
- [Tested static build archive](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/releases/download/v0.2.0/Cobalt_Static_Build_v0.2.0.tar.gz)
- [Source and file manifest](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/releases/download/v0.2.0/release-manifest.json)
- [SHA-256 checksums](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/releases/download/v0.2.0/SHA256SUMS.txt)

The manifest binds the package to the tagged GitHub Actions source and records static-file hashes. SHA256SUMS covers the other four attachments; published notes also contain the checksum file's digest. Report/source bytes remain the local release checkpoint; later receipt-only documentation does not replace those tagged artifacts.

The [annotated v0.1.0 tag](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/tree/v0.1.0) and [initial Release](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/releases/tag/v0.1.0) are preserved. Its [release run](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38331500958) passed 32 unit and 7 browser tests and attached the two historical reports. The initial two assets remain unchanged.

## Actual PR review

[PR #11](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/pull/11) contains the device pages, standby lifecycle, evidence corrections, version alignment, and regenerated reports. Its final PR CI and the actual main merge were checked separately above. [PR #1](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/pull/1) remains the earlier hardening and DevOps review. Follow-up receipt documentation uses a separate protected PR and must pass its own CI; earlier successful runs do not establish its final head checks.

## Device behavior and frozen local checkpoint

Version 0.2.0 implements **Gauges, Engine, Trends, Faults, and ACK** with shared softkeys, accepted history, and central acknowledgment. The graphite/black bezel, metallic rings, blue/cyan accents, and large white readouts remain a browser presentation of the existing simulator. Initial/reset standby shows zero in either unit system; Start or guided Run reveals accepted values, Pause holds them, and Reset returns presentation to zero. Zero placeholders never enter telemetry/model/diagnostic/history. Local checks passed 100/100 unit and 17/17 browser tests; both reports passed full nine-page visual and metadata/link QA. This report/source checkpoint stays unchanged while later remote receipts are recorded separately.

Current browser checks covered 30 device-page/theme/width combinations and the existing 18 application accessibility combinations, with zero JavaScript errors and passing readout typography checks. Unit runner duration was 2.56 s; browser wall time was 37.817 s. Six authentic cockpit captures were retained. [Current local version 0.2.0 evidence](validation-evidence.json) is separate from earlier local and remote receipts.

## Verification procedure for future changes

1. Review the concrete diff and local checks. Inspect every page of changed PDF/DOCX outputs and verify metadata, dates, links and report bytes.
2. Use a feature branch and protected PR. Inspect final-head CI outcomes and artifact content; main CI must verify the actual merge.
3. Verify provider source commits, behavior, referenced assets and report hashes on both public sites. Netlify's main build is independent of the Pages CI gate.
4. For an authorized new version, align package, lockfile, changelog, notes and reports, then push one new annotated tag after verification. Preserve existing tags and Releases.
5. Inspect the actual tag workflow, one published Release, notes, five expected attachments, SHA-256 manifest, downloaded bytes and the static archive. Record actual verified links and preserve checkpoint evidence.

The verified production URLs are [Netlify primary](https://cobalt-instrument-studio.netlify.app/) and [GitHub Pages backup](https://cloudwizardboricua.github.io/cobalt-instrument-studio/), both serving version 0.2.0 at the verified merge above. The application remains explicitly simulated and has no backend or hardware connection.
