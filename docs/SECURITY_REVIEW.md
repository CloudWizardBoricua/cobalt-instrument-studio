# Security review of the demonstration baseline

Edition: Fall 2026. This is a concise record of the requested Codex Security repository audit, not a certification or a substitute for production HMI security engineering.

## Result and exact scope

The Standard repository scan completed and sealed with **zero reportable vulnerabilities in the reviewed surfaces**. It used read-only offline source inspection, one independent baseline auditor, and parent reconciliation. No security fix was required or applied by this scan.

- Scan ID: `f9c259f0-2621-47ff-94dd-cfe37e0eedb5`.
- Baseline revision: `cb2297e750e5bc2acdd02b089874997ca3078667`.
- Reviewed surfaces: browser state/input/rendering, simulation and telemetry acceptance, build/artifact/publication scripts, CI/Pages/release workflows, deployment configuration, and relevant validation/privacy tests.
- The independent baseline fully reviewed 20 implementation, helper, and workflow files and corroborated the parent review.
- Completion recorded that the working tree changed during the scan; the sealed result remains tied to the original snapshot. It is **not a security scan of the final repository-polishing diff**.

Open the completed scan in the Codex Security workbench using its scan ID. The generated canonical report is retained outside the repository at:

```text
$CODEX_HOME/state/plugins/codex-security/scans/cobalt-instrument-studio/
  cb2297e750e5bc2acdd02b089874997ca3078667_20261028T011331Z_8pper8h1/report.md
```

The same scan folder contains `scan-manifest.json`, `findings.json`, `coverage.json`, `threatmodel.md`, and `exports/results.sarif`. Those are the authoritative generated artifacts; this file summarizes them without duplicating or modifying the sealed report. Token usage measurement was unavailable (`scan_thread_unavailable`).

## Controls established from source

| Surface | Evidence and practical meaning |
| --- | --- |
| Accepted telemetry | [telemetry.ts](../src/engine/telemetry.ts) requires own fields, exact contract version, finite numeric values, demonstration ranges, and ordered timestamps. It returns a whitelist copy. Rejected delivery retains valid readings and their original measurement age. |
| Settings and display inputs | [settings.ts](../src/engine/settings.ts) validates preferences and falls back on storage/JSON errors. [device-layout.ts](../src/engine/device-layout.ts) validates bounded labels and scales. React renders text; display properties do not modify the process or diagnostics. |
| CSV output | [studio-state.ts](../src/engine/studio-state.ts) exports internally generated retained values and quoted event text with a simulation disclaimer. No external user-text source feeding these exports was established. Adding one would need a separate spreadsheet-formula-injection review; CSV quoting alone is insufficient. |
| CI publication authority | [CI](../.github/workflows/ci.yml) defaults to read-only repository contents, does not retain checkout credentials, and pins official actions to full SHAs. Publishing permissions are confined to their designated jobs. |
| GitHub Pages | [Pages workflow](../.github/workflows/deploy-pages.yml) accepts only a successful same-repository main push, downloads the exact upstream run/attempt artifact, checks source/hash inventory, and checks current main before deploying the tested output. |
| Versioned release | [Release workflow](../.github/workflows/release.yml), [package-release.mjs](../scripts/package-release.mjs), and [publish-release.mjs](../scripts/publish-release.mjs) bind annotated tag/version/CI artifacts, constrain archive contents, round-trip hashes, check the GitHub upload destination, and verify uploaded bytes before publication. Existing releases are preserved. |
| Retained JSON reports | [prepare-test-reports.mjs](../scripts/prepare-test-reports.mjs) uses a fixed allowlist, realpath containment including parent junction resolution, and recursive redaction. Upload depends on successful report preparation. |
| Local validation servers | [Static build verifier](../scripts/validate-static-builds.mjs) binds loopback and constrains file reads to its selected build root. [Report refresh](../scripts/refresh-report-downloads.mjs) serves an exact map of known report paths on loopback. |
| Public HTTP verifier | [validate-public-http.mjs](../scripts/validate-public-http.mjs) constrains explicit stable HTTPS hosts/base paths, redirects, credentials, time, response size, and local comparison paths. This review inspected the code without contacting those endpoints. |

The sealed baseline used the earlier filenames `model.ts`, `studio.ts`, and `device.ts`. Current links above follow the polishing rename mapping to `instruments.ts`, `studio-state.ts`, and `device-layout.ts`; they are navigation aids, not a claim that the later diff was rescanned.

## Boundaries to explain accurately

GitHub Pages and Netlify have distinct publication paths. The Pages successful-CI artifact gate **does not gate Netlify**. [netlify.toml](../netlify.toml) defines a separate root-path build; source files cannot establish the Netlify account's production-branch selection, UI overrides, access policy, or deployment protections.

Hash inventories and local JSON execution-context markers are consistency checks within the trusted workflow's exact artifact selection. They are not independent cryptographic attestations and do not make arbitrary locally generated output eligible for publication.

`VITE_*` values are public build configuration. Browser localStorage is a preference store, not an authorization boundary or durable approved configuration history. Acknowledgment is a local record of alert review, not a safety action or proof of operator identity.

**SIMULATED — NOT LIVE EQUIPMENT.** The source has no live equipment interface, shared account backend, or hardware-control authority. No industrial authentication, calibrated protection limits, interlocks, or safety certification should be inferred from the screen's appearance or the automated tests.

## Limitations and follow-up

- No runtime exploitation, application execution, live credential validation, hosted account inspection, deployment mutation, or hardware testing was performed by this scan.
- Dependency implementation and current external dependency advisories were not verified. A passing source scan does not establish that the lockfile has no vulnerable packages.
- Binary PDF/DOCX metadata, screenshots, and Playwright traces were not inspected. The selected JSON sanitizer does not sanitize those binaries; review them separately before sharing sensitive diagnostic evidence.
- Historical validation receipts were reference content, not current proof of hosted or security behavior. Static CSS/SVG presentation files were inspected for external/script/import references rather than a full style audit. Git internals and dependency implementation were excluded.
- Initial architecture mapping had no separate architecture worker; the independent baseline later supplied architecture reconciliation. The configured-capacity preflight advisory did not prevent the completed review.
- The account access advisory returned Daybreak `not_granted`. The user was informed that protected outputs may not be displayable; this did not block the scan. See [Daybreak account access](https://chatgpt.com/cyber).
- The final polishing changes require normal diff review and validation. This baseline result establishes neither the final diff's security nor production suitability.

For ongoing maintenance, preserve the source boundaries above when changing imports, report paths, workflow steps, or archive packaging. `npm run verify:workflows` and `npm run verify:privacy` check specific repository contracts; passing them does not replace a security audit. The root [repository guide](../README.md) and [production architecture](HMI_ARCHITECTURE.md) explain the wider demonstration and future integration scope.

## Separate fresh dependency advisory observation

After the sealed source scan, the polishing sprint queried npm's advisory service without changing the lockfile. `npm audit --json` reports three affected development-package entries: `@vitest/mocker` moderate, `tinypool` critical, and the directly installed `vitest` critical via that dependency chain. Counts describe package entries, not three independent exploitable paths. `npm audit --omit=dev --json` reports zero production-package advisories at this observation. This is advisory data, not a demonstrated exploit of Cobalt.

The returned advisories include [mocker redirect traversal](https://github.com/advisories/GHSA-82fw-gwwq-j7x9), [manual mock registration injection](https://github.com/advisories/GHSA-qxg6-89mg-rqv8), and [tinypool worker-options](https://github.com/advisories/GHSA-5gmw-xhrv-c9v3) / [run-options](https://github.com/advisories/GHSA-85c8-ppgw-ccpr) prototype-pollution gadgets. npm proposes a major Vitest migration; do not force an automatic audit fix into this documentation cleanup.

[PR #17](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/pull/17) upgrades Vitest to 5.0.5 and removes tinypool, but requires its own Windows/report compatibility validation. See the [PR recommendations](REPOSITORY_AUDIT.md). The existing `dev` command binds Vite to loopback, and this project has no Vitest browser/mock server configured in its normal demonstration flow. That reduces relevance to the deployed static site; it does not establish every possible development execution safe.
