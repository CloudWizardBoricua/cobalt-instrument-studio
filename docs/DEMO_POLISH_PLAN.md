# Demo repository polishing plan

Prepared October 27, 2026, before implementation. Baseline: `cb2297e750e5bc2acdd02b089874997ca3078667`; dedicated branch: `docs/demo-repository-polish`.

## Read-only findings

The initial desktop worktree was clean. Local `main` and `origin/main` match the GitHub connector's freshly inspected default-branch SHA: zero ahead/behind. All retained product, fix and documentation branches are contained in main. Ten dependency proposals remain outside main; this does not establish whether unpushed laptop work exists. See [repository audit](REPOSITORY_AUDIT.md) for PR evidence and recommendations. No merges, pushes, releases or provider changes are part of this sprint.

All ten maintained TypeScript test files have current responsibilities; none will be removed. Baseline local unit results: 98/100 inside the Windows sandbox. The report-junction test passes in isolation outside it; the other failure is an LF-only fixture mutation against a CRLF workflow. TypeScript, workflow and privacy validation and both production builds pass. Browser/static results are recorded separately after completion. The test fixture will be normalized without changing publication behavior.

## Naming convention and proposed moves

Keep React components in PascalCase; non-component TypeScript, tests, styles and scripts use descriptive lowercase hyphenated names. Keep conventional `App.tsx`, `main.tsx`, `types.ts`, configuration names, `.github` paths, all script paths, report names and download URLs. Existing uppercase documentation names remain consistent with their neighbors. Domain code stays in `src/engine` because it contains the simulator engine, not a hardware gateway.

| Before | After | Reason |
| --- | --- | --- |
| `src/engine/model.ts` | `src/engine/instruments.ts` | Instrument metadata, scenario catalog and display conversion; dynamic evolution lives in simulation. |
| `src/engine/studio.ts` | `src/engine/studio-state.ts` | Session reducer, initialization and CSV serialization. |
| `src/engine/device.ts` | `src/engine/device-layout.ts` | Presentation layout contract and atomic edits, not device communications. |
| `src/styles.css` | `src/styles/studio.css` | Shared application styles grouped with component styles. |
| `src/device-workspace.css` | `src/styles/device-workspace.css` | Device engineering workspace styles. |
| `src/device-preview-pages.css` | `src/styles/device-preview-pages.css` | Five preview-page styles. |
| `tests/engine.test.ts` | `tests/studio-engine.test.ts` | Broad simulator/session behavior. |
| `tests/device.test.ts` | `tests/device-layout.test.ts` | Display-only layout validation. |
| `tests/standby.test.ts` | `tests/display-standby.test.ts` | Presentation lifecycle boundary. |
| `tests/ci-reports.test.ts` | `tests/test-report-privacy.test.ts` | Retained-report sanitization and containment. |
| `tests/workflows.test.ts` | `tests/deployment-workflows.test.ts` | CI/Pages publication boundaries. |
| `design-qa.md` | `docs/DESIGN_QA.md` | Existing design notes beside engineering documentation. |

Imports, source-sensitive tests, evidence compilation paths and active documentation links move together. Historical JSON receipts and binary reports remain frozen; their old paths describe their recorded revisions.

## Before and after

```text
Before                              After
root/                               root/
├── design-qa.md                     ├── README.md (demo navigation)
├── src/                            ├── src/
│   ├── *.css                        │   ├── styles/ (three stylesheets + README)
│   ├── App.tsx, main.tsx            │   ├── App.tsx, main.tsx, README.md
│   ├── engine/{model,studio,device} │   ├── engine/{instruments,studio-state,device-layout}
│   └── components/                  │   └── components/ (+ README)
├── tests/{engine,device,standby,...} ├── tests/{studio-engine,device-layout,display-standby,...}
├── docs/                            ├── docs/ (audit, plan, guides)
├── scripts/                         ├── scripts/ (same commands + documentation)
├── public/                          ├── public/ (same asset/download paths + guides)
└── .github/                         └── .github/ (same automation paths + guides)
```

Every maintained directory gets a purpose, Mermaid overview, annotated immediate tree, relationships, commands and demo context. Dependencies, Git internals, generated output/caches and third-party files are excluded. Public directory READMEs are intentionally copied as static documentation by Vite; the download paths and application behavior are unaffected.

Homepage follow-up: use [`.github/GUIDE.md`](../.github/GUIDE.md) for the automation directory guide. GitHub gives a README directly under `.github` priority over the root README, so that filename is the deliberate exception to the directory README convention.

## Reviewable implementation groups

1. This audit/plan and detailed PR recommendations.
2. Coordinated file moves, import/path updates, case checking and the portable fixture correction; preserve runtime logic and dependency versions.
3. Purposeful file/section comments and directory guides; distinguish implemented simulation from proposed industrial integration.
4. Final validation evidence and test assessment.

## Verification and deployment protection

Run locked-dependency tests/types/workflow/privacy checks, Playwright, both base-path builds and static browser validation. Compare TypeScript executable syntax before/after comments and normalized renames, exact-case imports, public report hashes and production asset bytes where applicable. Preserve existing approved captures and historical JSON receipts after checks that regenerate them. Do not regenerate the frozen PDF/DOCX or release metadata.

Netlify uses Node 24, `npm run build`, `dist`, and `/`; Pages uses `npm run build:pages`, `dist-pages`, and `/cobalt-instrument-studio/`. Pages deploys the exact successful main CI artifact; Netlify rebuilds independently. React navigation uses view state, so no route rewrite is needed. Build-time `VITE_*` values are public. Local validation of this branch cannot prove hosted deployment of it.

GitHub, Context7 (Vite 7 documentation; nearest indexed patch disclosed), Product Design (fresh screenshot-based demo review), and Codex Security (read-only repository audit) contribute evidence. Access limits and fresh versus historical observations will be explicit in the final reports.
