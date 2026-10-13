# DevOps verification and publication handoff

_Developed by Daren Diaz_ · [GitHub repository](https://github.com/CloudWizardBoricua/cobalt-instrument-studio)

Fall 2026 · Version 0.2.0 release preparation

[PR #1](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/pull/1) established the earlier main `453ea4a126fab0a44f4345871b401a5c11fbce86` checkpoint with successful CI and production. Version 0.2.0 implements five blue cockpit pages, standby and evidence corrections locally. Validation passed 100 unit and 17 browser tests, all nine pages of each report, metadata/links, and both hosting builds/downloads. Actual new publication remains pending and approved through reviewed PR/main and annotated `v0.2.0` release verification. Existing v0.1.0 is preserved.

## Reviewed scope

- Preserve the simulator while adding accepted-sample validation, two fault/recovery scenarios, a device preview/signal browser/property editor, accessible state cues, neutral Design concept branding, and adjacent developer/repository credit.
- Improve the three existing GitHub workflows. CI uses the lockfile and named steps, produces both tested static bases, and preserves selected test reports, screenshots, and failure traces.
- Gate Pages on a successful main CI run and consume its exact tested artifact. Keep Netlify as primary and Pages as backup.
- Reuse CI for releases, require annotated tag/version agreement, package tested outputs, generate SHA-256 evidence, and verify attachments before publishing one Release. Preserve the existing initial release.
- Pin official actions to verified immutable commits, scope token permissions per job, configure npm/Actions Dependabot, and explain lifecycle and local reproduction in README.

## Actual execution and remaining evidence

The [PR execution record](workflow-pr-validation.json) verifies branch head `27cfdd078a1e961061a047e83593d4f87b361230` and tested merge `c8a58613e67e1c64a276496ff64d4c0a6d8cc8db`; the tested tree matches actual merge `453ea4a126fab0a44f4345871b401a5c11fbce86`. Downloaded evidence confirms **92/92 unit tests, 12/12 Linux Chromium browser tests**, 18 layout/focus/reduced-motion combinations, both static bases, and six authentic screenshots. Production artifact `cobalt-production-builds-1` had its ZIP digest and source/file hashes verified, with observed 14-day retention. [Retained production artifact](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38341235636/artifacts/11786956557)

[Production HTTP/deployment verification](workflow-production-validation.json) confirms successful main CI and Pages deployment, ready Netlify production, and exact current report-download hashes at both origins. [Production browser verification](workflow-production-browser.json) passed 12/12 checks on each site using installed Edge: controlled-clock scenario paths plus a real-clock smoke. Measured wall times were 35.158 s on Netlify and 31.163 s on Pages, with 18 view/theme/width combinations per site. These durations are observations, not performance guarantees.

## Artifact privacy finding and repository governance

The original temporary test artifact included automatically captured Git author/committer contact metadata. Test execution succeeded, but this content inspection had a finding. With explicit approval, both affected temporary test artifacts were deleted and their absence verified; production artifacts were retained. Contact values are omitted from authored evidence. Disabling/sanitizing Git capture is a local correction that still needs publication and fresh CI verification. [Governance and cleanup evidence](workflow-governance-validation.json)

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

## Remaining remote evidence

The [annotated v0.1.0 tag](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/tree/v0.1.0) and [initial Release](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/releases/tag/v0.1.0) are preserved. Its [release run](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38331500958) passed 32 unit and 7 browser tests and attached the two historical reports. Version 0.2.0 is approved to execute the enhanced pipeline with a tested static archive and checksum manifest after current QA and CI pass; no new release is claimed yet.

The earlier substantive PR, main CI, and deployment paths have executed and been verified above. Version 0.2.0 has publication approval and awaits final local checks, new reviewed PR/main CI, and actual tag workflow execution. The initial two release assets remain historical and unchanged.

## Actual PR review

[PR #1](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/pull/1).

The merged PR describes the earlier hardening and DevOps checkpoint. Its successful PR run verifies that branch source; main CI separately verified the actual merge. A new substantive version 0.2.0 PR will include the device pages, evidence corrections, version alignment, and regenerated reports. It is authorized but no actual new PR/run URL is supplied until created and verified.

## Local device-page follow-up

Branch `feat/device-pages-and-evidence` implements **Gauges, Engine, Trends, Faults, and ACK** with shared softkeys, accepted history, and central acknowledgment. The graphite/black bezel, metallic rings, blue/cyan accents, and large white readouts remain a browser presentation of the existing simulator. Initial/reset standby shows zero in either unit system; Start or guided Run reveals accepted values, Pause holds them, and Reset returns presentation to zero. Zero placeholders never enter telemetry/model/diagnostic/history. Local checks passed 100/100 unit and 17/17 browser tests; both reports passed full nine-page visual and metadata/link QA. Actual new publication remains pending.

Current browser checks covered 30 device-page/theme/width combinations and the existing 18 application accessibility combinations, with zero JavaScript errors and passing readout typography checks. Unit runner duration was 2.56 s; browser wall time was 37.817 s. Six authentic cockpit captures were retained. [Current local version 0.2.0 evidence](validation-evidence.json) is separate from earlier local and remote receipts.

## Approval boundaries and verification sequence

1. Review the version 0.2.0 diff; local 100-unit/17-browser checks and full nine-page PDF/DOCX visual/metadata/link inspections are complete.
2. Use the approved feature branch/PR/main publication process. Inspect new CI test outcomes and artifact content, then verify both actual production commits, behavior, and report hashes.
3. Verify version 0.2.0 agreement across package, lockfile, changelog, notes, and reports; create and push the approved new annotated `v0.2.0` tag after CI succeeds. Preserve `v0.1.0` unchanged.
4. Monitor the actual tag workflow. Verify one published Release, accurate notes, five expected attachments, SHA-256 manifest, downloaded bytes, and the static archive's tested contents. Add actual version tag, Release, workflow run, and download links.
5. Retain the verified main rules and confirm their required check after workflow changes. Record actual version 0.2.0 run, deployment, Release, and download links; publication approval alone is not execution evidence.

The verified production URLs remain [Netlify primary](https://cobalt-instrument-studio.netlify.app/) and [GitHub Pages backup](https://cloudwizardboricua.github.io/cobalt-instrument-studio/), both at the merged checkpoint above. The application remains explicitly simulated and has no backend or hardware connection.
