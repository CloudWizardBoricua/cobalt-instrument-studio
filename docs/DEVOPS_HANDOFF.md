# Local DevOps review and publication handoff

_Developed by Daren Diaz_ · [GitHub repository](https://github.com/CloudWizardBoricua/cobalt-instrument-studio)

Fall 2026 · Unreleased revision of version 0.1.0

The substantive application and workflow revision is approved for pushing the reviewed `feat/telemetry-devops-hardening` branch and creating its real PR. Modified GitHub execution and the actual PR/run links are pending. Approval does not include a merge to `main`, production deployment, a new version tag/Release, or branch-protection changes. Main production sites and the initial release remain unchanged.

## Reviewed scope

- Preserve the simulator while adding accepted-sample validation, two fault/recovery scenarios, a device preview/signal browser/property editor, accessible state cues, neutral Design concept branding, and adjacent developer/repository credit.
- Improve the three existing GitHub workflows. CI uses the lockfile and named steps, produces both tested static bases, and preserves selected test reports, screenshots, and failure traces.
- Gate Pages on a successful main CI run and consume its exact tested artifact. Keep Netlify as primary and Pages as backup.
- Reuse CI for releases, require annotated tag/version agreement, package tested outputs, generate SHA-256 evidence, and verify attachments before publishing one Release. Preserve the existing initial release.
- Pin official actions to verified immutable commits, scope token permissions per job, configure npm/Actions Dependabot, and explain lifecycle and local reproduction in README.

## Actual execution and remaining evidence

The [read-only remote baseline](workflow-remote-baseline.json) verifies the published source at commit `421ea725f9be740f86d7b61e445e37e18a1f4d0b`. Its [CI run](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38333357919) passed 32 unit tests and 7 browser tests, and its [Pages run](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38333358441) succeeded. The Netlify main deployment is ready. Fresh real-clock production-browser observations passed 10 check groups per site; direct assets/reports returned 200 and report hashes matched the unchanged initial release. These results concern the published three-scenario baseline and old workflows.

## Actual local DevOps validation

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

Failure screenshots use `only-on-failure`; traces use `retain-on-failure`. These are configured capture policies, not a claim that a failing browser case occurred. The earlier engineering report and hardening evidence retain their separate **58 unit/12 browser** checkpoint; they do not contain the later 92-test DevOps count. [Local DevOps evidence](devops-local-validation.json) records the checks above. This local verification does not establish that the modified workflows have executed on GitHub.

The ignored `.local/devops-release-dry-run` output contains the five prepared attachments. Its archive is 1,480,362 bytes with SHA-256 `bafeeb90e020addcead57560ecc33be1fa209de5697af028ca42dc467030826d`. This dry run uses current version 0.1.0 only to inspect packaging; its context is local and uncommitted. It creates or replaces no tag, Release, or public asset. A future publication still needs an approved new semantic version and actual GitHub verification.

## Remaining remote evidence

The [annotated v0.1.0 tag](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/tree/v0.1.0) and [initial Release](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/releases/tag/v0.1.0) already exist. The [release run](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38331500958) succeeded with 32 unit and 7 browser tests. Its only assets are the historical PDF/DOCX; a tested static archive and checksum manifest have not been published. The improved packaging path needs a new approved version, not replacement of that tag or Release.

The approved substantive PR awaits actual creation and verified links. `main` is currently unprotected. **CI verification** is the recommended required check; this recommendation does not enable a repository rule. Local workflow validation is preparation, not proof that the modified YAML has executed on GitHub.

## Proposed PR

Suggested title: **Harden Cobalt telemetry and verify publication workflows**.

The approved PR description is prepared with the complete diff and actual validation above: application hardening and device workspace, neutral concept branding, report updates, inspectable CI artifacts, gated Pages publication, and release packaging. GitHub execution remains pending until those checks run. The substantive PR must link its actual successful run and artifacts after creation; no placeholder URL or artificial activity is needed.

## Approval boundaries and verification sequence

1. Push the approved reviewed feature branch and open its real PR. Run PR CI, inspect artifacts, and fix actual failures on that branch. Add the resulting PR and successful run links to README. These feature branch/PR actions are now authorized.
2. Obtain authorization for merging to `main`, which triggers the existing Netlify integration and the CI-gated Pages process. Monitor main CI and both providers. Verify the exact published source, referenced assets, controls, all five scenarios, workspace, mobile views, and direct report-download hashes on both sites.
3. Select and review a new semantic version with aligned package, lockfile, changelog, notes, and report metadata. Only after version/publication authorization, create and push its new annotated tag. Preserve `v0.1.0` unchanged.
4. Monitor the actual tag workflow. Verify one published Release, accurate notes, five expected attachments, SHA-256 manifest, downloaded bytes, and the static archive's tested contents. Add actual version tag, Release, workflow run, and download links.
5. Consider required checks for `main` as a separately authorized repository setting. Record whether rules were actually enabled and verify their exact check names.

The existing production URLs remain [Netlify primary](https://cobalt-instrument-studio.netlify.app/) and [GitHub Pages backup](https://cloudwizardboricua.github.io/cobalt-instrument-studio/). They currently show previously published source. The local application remains explicitly simulated and has no backend or hardware connection.
