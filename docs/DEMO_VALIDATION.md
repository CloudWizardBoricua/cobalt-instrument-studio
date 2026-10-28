# Repository polishing validation

Fall 2026 · Baseline `cb2297e750e5bc2acdd02b089874997ca3078667` · Branch `docs/demo-repository-polish`

## Outcome and scope

Application behavior and existing public URLs are preserved. The cleanup renames 12 maintained paths, groups styles, documents source/major sections and adds README guides to all 14 maintained subdirectories. Root README is the main navigation guide. No tests were removed and no dependency versions changed. The only test logic fix normalizes a workflow fixture's line endings; one browser-test title now correctly says simulated telemetry. The new `verify:paths` command checks exact-case imports; TypeScript explicitly enforces consistent casing.

The [plan](DEMO_POLISH_PLAN.md) contains the before/after tree and complete rename mapping. The [test assessment](TEST_RELEVANCE.md) explains every suite. The [repository audit](REPOSITORY_AUDIT.md) records synchronization and all PR recommendations. Fresh sanitized measurements are retained in [demo-polish-validation.json](demo-polish-validation.json); raw test/log outputs remain ignored under `.local`.

## Baseline versus final local checks

Environment: Windows desktop, Node 24.19.0, npm 11.17.0, locked Vite 7.3.7 / Vitest 3.2.7, installed Edge for Playwright. Required Git signing and browser/junction operations were run outside the restrictive sandbox where necessary. No hosted pipeline was triggered for this local branch.

| Check | Baseline | Final |
| --- | --- | --- |
| TypeScript | Pass | Pass |
| Workflow contracts and immutable action references | Pass | Pass; parsed automation values unchanged |
| Privacy/content | Pass | Pass; binary metadata remains outside this text checker |
| Exact-case source imports | No dedicated command | Pass: 87 relative imports; no maintained-source case collisions |
| Unit tests | 98/100 inside sandbox; two failures below | **100/100 across eight files**, outside sandbox |
| Application browser suite | **17/17**, 45.9 s | **17/17**, 46.3 s |
| Netlify root build | Pass, `dist` | Pass, same output/base |
| Pages project build | Pass, `dist-pages` | Pass, same output/base |
| Static production-browser checks | **12 groups per base**, no JavaScript errors | **12 groups per base**, no JavaScript errors |
| PDF/DOCX in both local builds | Exact approved bytes | Exact approved bytes |
| Source behavior comparison | Reference snapshot | 50 existing TS/TSX/MJS/CSS files match after ignoring comments/formatting and normalizing declared moves/test wording; only approved fixture normalization differs |
| Historical assets and receipts | Reference snapshot | Existing PNG/report bytes and Git-normalized JSON preserved |

The browser/static checks exercise controls, guided process/delivery faults, rejection retention, stale timeout/recovery, acknowledgment, property application, view/layout behavior, report links/downloads and bounded history. These are simulator checks, not hardware qualification. Test times describe these runs only.

### Pre-existing failures and correction

1. `tests/workflows.test.ts` (now `deployment-workflows.test.ts`) mutated an LF-only multiline substring. A CRLF checkout left the intended invalid fixture unchanged, so the validator correctly accepted it and the negative assertion failed. Normalizing only the loaded fixture with `.replace(/\r\n/g, "\n")` fixes the test. Workflow behavior is unchanged; all 11 workflow tests pass.
2. The retained-report junction test could not create a Windows fixture inside the sandbox (`EPERM`). It passed **3/3** in the isolated baseline suite outside the sandbox and passes in the final complete suite there. The containment assertion remains; no skip or deletion hides this environment restriction.

### Preservation evidence

The default-environment builds retain byte-identical JavaScript, chart chunk, CSS, favicon and PDF/DOCX compared with the baseline builds at both bases: 12 of the original 14 output files are unchanged. The two HTML entries add explanatory comments. Two new README files per output are intentionally copied from `public`; existing URLs and runtime behavior are unchanged.

TypeScript structural comparison ignored JSDoc/comments, empty JSX comment expressions and whitespace-only JSX nodes, normalized the declared paths/test title, and separately allowed the reviewed fixture normalization. Python syntax/code AST (ignoring documentation strings) and native config comparisons supplement that check. Workflow/Netlify parsed values, dependency ranges and the lockfile remain unchanged; package scripts add only the path-check command. Active imports, source-sensitive privacy checks, evidence-transpilation paths and documentation links follow the new names. Historical receipts intentionally retain their recorded old paths.

## Existing hosted deployments

| Evidence | Observed result | Limit |
| --- | --- | --- |
| GitHub main CI | [40237618134](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/40237618134) succeeded for `cb2297e`; actual logs show 100 unit/17 browser tests | Baseline main, not the cleanup branch |
| GitHub Pages | [40238102350](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/40238102350) succeeded for the same source, including exact artifact/hash/current-main gates and deployment | Existing hosted deployment; no new deployment performed |
| Both public entries | Anonymous HTTPS 200 with expected title; in-app browser rendered both | Availability at observation, not uptime guarantee |
| Both hosts' built JS/chart/CSS | HTTP 200 and exact bytes match local builds using the public production `VITE_SOURCE_URL` and correct base | Matching runtime assets do not establish a Netlify provider source SHA |
| Both hosts' favicon | HTTP 200; exact byte comparison fails, LF-normalized content matches | Linux-hosted LF versus Windows checkout CRLF; strict checker is not reported as passing |
| Both hosts' PDF/DOCX | HTTP 200 and exact bytes match approved reports | Binary layout/metadata was not regenerated or re-audited |
| Public browser interaction | Netlify scenario selection/Run/recovery/pause/device-page observation; Pages opening smoke | Narrower than full live-origin regression testing |
| Netlify provider settings | No connector available; exact source SHA/UI overrides not verified | Retained provider receipts are historical |
| Current branch protection | GitHub integration returned 403 | Historical protection record is not fresh confirmation |

The existing `validate-public-http.mjs` run exited nonzero at its strict favicon comparison. Further explicit reads isolated the line-ending difference, then compared every referenced application asset and both report downloads. Builds using the normal unset source-link variable have different JS hashes from production; setting the existing public production variable reproduced exact hosted JS bytes. Neither finding justified changing application or verification semantics during this cleanup. The original HTTP receipt was restored; fresh observations are in this sprint's JSON.

Report hashes on both local builds and both hosts:

```text
PDF  c4ff1a7eb279292c365aea2acc579fa92313841933ddbe2af775e2dcf780e8e9
DOCX 07d24a9b80d4f88bfc3ec3351599e5ed74bc2ad340b17b54933b575a3cc4be79
```

Netlify keeps `npm run build` → `dist`, Node 24 and `/`. Pages keeps `npm run build:pages` → `dist-pages` and `/cobalt-instrument-studio/`. Local React view state needs no routing rewrite; report paths remain stable. Public `VITE_*` settings are build configuration, not secrets. Pages deploys verified main-CI output; Netlify independently rebuilds. [Deployment guide](DEPLOYMENT.md)

## Plugin contributions and remaining concerns

- **GitHub:** fresh default-branch/branch/PR diffs, review/conflict/CI evidence and confirmed baseline Pages execution. Ten dependency proposals remain open; no remote changes were made. [Recommendations](REPOSITORY_AUDIT.md)
- **Context7:** resolved official Vite docs and consulted public base, static deployment and `publicDir` behavior. Actual Vite is 7.3.7; the closest indexed patch used was 7.3.5, disclosed rather than called an exact version match. [Versioned source documentation](https://github.com/vitejs/vite/blob/v7.3.5/docs/guide/build.md)
- **Product Design:** fresh captured walkthrough and evidence-based presentation/accessibility observations. Scope improvements are in the guide and source navigation; interface recommendations remain separate. [Usability report](DEMO_USABILITY.md)
- **Codex Security:** completed a sealed, independent source-backed baseline scan with zero reportable findings. It is not a final-diff scan or security certification. Daybreak access was not granted; usage measurement was unavailable. A separate fresh npm audit flags three development-package entries (two critical, one moderate), while production-only audit reports zero. Prioritize independent PR #17 review; do not auto-upgrade this cleanup. [Security scope and advisories](SECURITY_REVIEW.md)

Hardware acquisition, authenticated operations, durable alarms/history, independent watchdogs, physical panel qualification, long soak and complete assistive-technology evaluation remain unimplemented or unverified. The future [HMI architecture](HMI_ARCHITECTURE.md) and [roadmap](ROADMAP.md) describe that work without claiming it exists today.

## Repeat the local checks

```sh
npm ci
npm run typecheck
npm run verify:paths
npm run verify:workflows
npm run test:ci
npm run verify:privacy
npm run build
npm run build:pages
npm run test:e2e
npm run verify:static -- --skip-build
node scripts/prepare-test-reports.mjs
```

Use `npm.cmd` on Windows if needed; confirm any locally reused 5173 server is this project. Review generated screenshots/receipts, preserve the intended evidence, then inspect the diff. Linux CI installs Chromium; fresh Linux execution of this polishing branch still awaits a later PR. Begin presentation with [DEMO_WALKTHROUGH.md](DEMO_WALKTHROUGH.md).
