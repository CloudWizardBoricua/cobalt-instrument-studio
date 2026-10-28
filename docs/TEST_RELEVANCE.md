# Test relevance and baseline assessment

Fall 2026 · repository polishing sprint

All ten maintained TypeScript test files were read alongside current engine/components, build scripts and workflow configuration. The inventory contains eight Vitest files with 100 parameterized cases and two Playwright files with 17 browser cases. All remain maintained; no test was deleted. [Test navigation](../tests/README.md) links each suite to its feature.

## Assessment and rename map

| Before | After | Classification and evidence |
| --- | --- | --- |
| `tests/engine.test.ts` | `tests/studio-engine.test.ts` | Relevant: seeded simulation trajectories, bounded channels, session actions, diagnostic debounce/hysteresis/ACK, validated preferences, canonical units and CSV contracts all map to implemented engine behavior. |
| `tests/device.test.ts` | `tests/device-layout.test.ts` | Relevant: six-slot binding/label/scale validation, immutable atomic edits, per-slot reset, clipping and malformed-layout rejection protect the presentation model. |
| `tests/standby.test.ts` | `tests/display-standby.test.ts` | Relevant: `hasStarted` distinguishes prepared samples from initial zero displays; pause-before-first-tick and guided replay are distinct from ordinary running-state tests. |
| `tests/telemetry.test.ts` | Unchanged | Relevant: owned whitelist/version/numeric/timestamp validation, stale-data retention, rejection evidence/flood caps and deterministic fault/recovery paths map to acquisition behavior. |
| `tests/privacy-content.test.ts` | Unchanged | Relevant: actual application/report sources are positive fixtures, with independent negative mutations for disclaimer, credit, source link, report edition/version and README content. Source paths were updated with engine renames. |
| `tests/ci-reports.test.ts` | `tests/test-report-privacy.test.ts` | Relevant: synthetic private-text fixtures, interrupted JSON, untouched screenshots/traces and out-of-project junction rejection protect retained evidence. Junction setup requires OS permission. |
| `tests/workflows.test.ts` | `tests/deployment-workflows.test.ts` | Needed updating; fixed: valuable action/permission/artifact/gate tests included an LF-only fixture mutation that missed CRLF text. Normalize only the loaded test fixture, preserving the workflow itself. |
| `tests/release-workflow.test.ts` | Unchanged | Relevant: version/tag/source checks, exact inventories, report signatures/equality, tar round-trip, local/CI distinction and mocked GitHub rerun/error/corrupt-upload cases protect packaging/publication. |
| `tests/e2e/studio.spec.ts` | Unchanged | Relevant; wording clarified: twelve visible application cases cover scenarios, retained readings, controls, preferences, display edits, CSV and selected accessibility/layout checks. The wall-clock case now says “simulated telemetry.” |
| `tests/e2e/device-pages.spec.ts` | Unchanged | Relevant: five cases check tabs/softkeys/key navigation, shared ACK/escalation, three accepted-history trends, 30 page/theme/width combinations and zero-standby behavior. |

There are no obsolete or uncertain feature mappings. Environment restrictions and brittle test fixtures are recorded as such; neither justifies deleting an unfamiliar assertion.

## Reproduced baseline and focused correction

The initial Windows sandbox run passed **98/100 unit cases**. Two results need different explanations:

1. The negative workflow fixture replaced a multiline LF string inside a CRLF checkout. The replacement did nothing, so the deliberately invalid configuration was never produced. This was a test portability defect, not evidence that the production validator accepted the intended invalid configuration. The fixture is now normalized with `.replace(/\r\n/g, "\n")` before mutations.
2. The report-privacy escape-path case failed during junction creation with `EPERM`. All **3/3 report-privacy cases passed** in an isolated run outside that sandbox restriction. The escape-path assertion remains unchanged; no permission-dependent skip was added.

Initial TypeScript, workflow/privacy validation and both local production builds passed. The initial installed-Edge browser suite passed **17/17 cases**. Those observations describe this sprint's baseline; the separate historical engineering checkpoint still records its own runtime, counts and artifacts. Final rerun results belong in the sprint validation report and must distinguish sandbox limitations from genuine assertion failures.

The implementation changes here are limited to meaningful names/import references, source comments, CI-fixture newline normalization and the simulated-telemetry title. No test expectation, fixture payload, scenario timing or maintained output path was removed or weakened.

## Coverage overlap and fragile assumptions

Unit, browser and static-build checks intentionally overlap at different boundaries. Exact unit state assertions protect invalid-input handling and transition timing; browser cases protect the connection between central state, controls and visible labels; static-build verification protects project-base assets, direct downloads and compiled interaction paths. Similar ACK/recovery checks across those layers are not obsolete duplicates.

Remaining coupling is documented rather than hidden:

- Content tests inspect specific source strings and approved attribution, so future extraction of markup requires coordinated validator/fixture updates.
- Workflow tests intentionally assert exact script commands, workflow filenames, job contracts and artifact paths. Organizational moves must update these as one change.
- Browser selectors use visible labels/test IDs; CSS measurements cover chosen colors, focus and typography rather than every accessibility criterion.
- E2E and static verification overwrite tracked screenshots/evidence. Routine test execution can therefore dirty the working tree. This sprint preserves those output contracts and historical approved artifacts.
- Browser scenarios use virtual clocks. One separate real-clock smoke demonstrates ticks/pause, but neither establishes hardware deadlines or sustained frame rate.
- Release tests require `tar`; the junction fixture requires permission to create a directory link. Those are setup prerequisites, not reasons to classify the underlying protections obsolete.

## Missing coverage and honest HMI limits

The code and tests describe a browser simulation. They provide no real PLC/CAN/J1939/Modbus transport, authenticated operator roles, durable process history/ACK service, concurrent control arbitration, safety interlocks or emergency-stop path. Automated model tests cannot demonstrate sensor calibration, network quality, actual actuator response, industrial certification or a safe operating envelope for equipment.

Useful future work includes long-duration browser/restart/storage-failure scenarios, browser-denied storage behavior, full assistive-technology testing, and authenticated acquisition/reconnection testing if a real backend is implemented. Unit storage-denial fallback is already covered; a full browser storage-denial flow is not. Desktop/narrow viewports do not prove physical phone or cellular-network behavior. Firefox/Safari and real target HMI firmware are outside the measured browser scope.

For a presentation, explain three distinct ideas: a valid process reading can trigger an alarm; an invalid sample must not replace the last accepted reading; acknowledgment records a person's review without repairing the condition. [The engine guide](../src/engine/README.md), [test inventory](../tests/README.md) and [browser guide](../tests/e2e/README.md) provide the corresponding code entry points.
