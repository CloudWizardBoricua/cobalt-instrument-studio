# Engineering hardening checkpoint and review handoff

_Developed by Daren Diaz_ · [GitHub repository](https://github.com/CloudWizardBoricua/cobalt-instrument-studio)

Fall 2026 · Version 0.2.0

**SIMULATED — NOT LIVE EQUIPMENT.** This sprint preserves the static simulator and adds invalid-data protection, deterministic fault/recovery paths, and display configuration. No backend, authentication, equipment access, safety control, hardware integration, or production certification is implemented.

## Actual starting checkpoint

Before feature changes, the local source was freshly checked rather than relying on previous deployment claims: **32/32 unit tests, 7/7 browser tests, typecheck, and both local static hosting-base builds/checks passed**. The baseline browser suite took 66,294 ms. Existing behavior included six instruments, four modes, three guided replays, bounded history/events, validated settings, acknowledgment/recovery, responsive views, and a scenario dropdown. No telemetry acceptance contract or device property workspace existed.

The earlier hardening checkpoint was merged through [PR #1](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/pull/1) at main `453ea4a126fab0a44f4345871b401a5c11fbce86`. Version 0.2.0 was merged through [PR #11](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/pull/11) at main `5e7615a98478ae14301da4377c9e6a2255cd2139` and is deployed to both public hosts. Final PR/main CI passed 100/100 unit and 17/17 Linux Chromium browser tests; both origins passed 17/17 public browser tests. Both reports passed nine-page visual and metadata/link inspection, and downloads match their reviewed bytes. The new annotated tag workflow succeeded and published one verified Release with five inspected assets. Existing v0.1.0 is preserved.

## Reviewed changes

| Change                          | Engineering value                                                                                    | Boundary                                                              |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Telemetry contract v1           | Rejects incompatible, malformed, nonfinite, implausible, duplicate, out-of-order, and future samples | Protects accepted readings/time/history and metric debounce           |
| Rejection evidence and recovery | Explains retained values and increasing sample age; counts repeats and deduplicates reasons          | Bounded events, no message floods; valid delivery closes episode      |
| Oil pressure loss               | Exercises low-threshold warning, critical escalation, acknowledgment and clearing                    | Process fault uses valid generated samples                            |
| Invalid sample delivery         | Demonstrates rejection, staleness, timeout and valid recovery                                        | Delivery fault does not contaminate model or accepted display         |
| Device workspace                | Original six-slot preview, signal browser, display property editor                                   | Session-only display edits never change engine commands or thresholds |
| Device pages                    | Gauges, Engine, Trends, Faults, and ACK with blue cockpit styling and shared softkeys                  | Accepted samples/history and central ACK; browser preview only        |
| Display standby                 | Initial/reset zero readouts, Start/Run reveal accepted values, Pause holds readings                     | Zero placeholders never enter samples, model, diagnostics, or history |
| Test-evidence privacy           | Disabled Git metadata capture and sanitized report output with regression tests before upload          | Downloaded final PR/main reports passed selected JSON privacy checks  |
| Accessibility/usability         | Focus, labels, textual states, reduced motion and meaningful announcements                           | Checked local browser behavior; formal audit remains future work      |
| Documentation/evidence          | Shared PDF/DOCX, contract, roadmap, tests and authentic screenshots                                  | Local outputs included in both static builds                          |

## Expected and observed outcomes

All times are simulated, seed 27041 with default settings. Final measured outcomes are recorded in [validation evidence](validation-evidence.json).

| Scenario           | Expected outcome                                                         | Observation to review                                                                                                                                                      |
| ------------------ | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Normal ramp        | Smooth speed/load increase, no default alert                             | Final accepted values and transition list at 35 s                                                                                                                          |
| Coolant overheat   | Degradation at 6 s; warning then critical                                | Default transitions at 14.0 s/223.5 degrees F and 18.5 s/236.8 degrees F                                                                                                   |
| Communication loss | Retain 4.5 s sample; timeout at 6.5 s; resume at 17 s                    | Critical communication at 6.5 s and normal at 17 s; 27 accepted samples by 25 s; no rejected attempts                                                                      |
| Oil pressure loss  | Decline from 5 s; warning/critical; restore from 24 s                    | Warning 11.5 s/22.199 psi; critical 15.5 s/14.726 psi; warning recovery 26.0 s/23.410 psi; normal 27.5 s/30.110 psi; zero rejected samples                                 |
| Invalid delivery   | Reject 5–16.5 s; retain accepted sample; timeout at 6.5 s; valid at 17 s | 24 rejects, five deduplicated reason events, retained 4.5 s readings; timeout at 6.5 s, one delivery recovery and communication clear at 17 s; accepted/history 27 by 25 s |

The contract is documented in [TELEMETRY_CONTRACT.md](TELEMETRY_CONTRACT.md). Plausibility acceptance bounds differ from generator/display domains and are not calibrated equipment limits. Preview labels/ranges/bindings affect presentation only. Layout is session-only; no device export/runtime is claimed.

## Earlier hardening validation

The completed engineering hardening checkpoint passed **58/58 unit tests, 12/12 browser tests, typecheck, and both production-base build/browser checks**. Three views at 1440, 390, and 320 pixel widths in two themes passed 18 layout/focus/contrast combinations. Selected text contrast was 5.62 to 1 at night and 5.27 to 1 in day mode. Its PDF and DOCX each contained nine visually inspected pages, with adjacent developer/repository credit; privacy and packaged report-byte checks passed. These are earlier checkpoint observations. The current [validation evidence](validation-evidence.json) and [hosting build evidence](hosting-build-validation.json) describe the later version 0.2.0 local revision. The intervening combined DevOps revision passed 92 unit and 12 browser tests; [DevOps evidence](devops-local-validation.json) preserves that separate checkpoint.

Guided browser tests use controlled clocks. A separate real-time smoke observes visible updates and pause; its timing includes interactions. Browser viewport checks do not establish physical phone/cellular behavior. No Safari/Firefox result, assistive-technology audit, heap/frame-rate benchmark, long browser soak, hardware measurement, uptime guarantee, or production certification is claimed.

## Final local version 0.2.0 validation

The current local revision passed **100/100 unit tests across eight files** and **17/17 browser tests**. The unit runner took 2.56 s; summed test-file durations were 3,849.931 ms. Browser wall time was 37.817 s, with zero JavaScript errors. Device checks covered five pages in two themes at three widths, totaling 30 combinations, alongside the existing 18 application accessibility combinations. Standby/start/pause/reset, metric zero display, central ACK, accepted-history retention, softkeys and typography passed. Six authentic cockpit screenshots were captured, including Engine after Start and mobile zero standby. [Current local evidence](validation-evidence.json)

Each current report passed visual inspection of all nine pages; author metadata is blank, precise dates are absent, and repository links were verified. Both production builds passed 12 check groups each and downloaded matching 459,765-byte PDF and 554,147-byte DOCX copies. [Hosting build validation](hosting-build-validation.json) records their hashes. PDF/DOCX, shared source and release notes preserve this local checkpoint; later GitHub/publication receipts are separate. Earlier 58/12 and 92/12 results retain their historical scope.

## Deliverables

- [README](../README.md) and [changelog](../CHANGELOG.md)
- [Telemetry contract and rejection policy](TELEMETRY_CONTRACT.md)
- [Shared report source](report-source.json)
- [Engineering PDF](Cobalt_Engineering_Report.pdf) and [editable DOCX](Cobalt_Engineering_Report.docx)
- [Implemented work and 19 future improvements](ROADMAP.md)
- [Verified hosting and publication procedure](DEPLOYMENT.md)
- Authentic local screenshots under `docs/assets`

The report copies in `dist/reports` and `dist-pages/reports` match the visually reviewed originals, as do current production downloads and Release attachments. The original supplied prompt remains outside this dedicated project. Global tooling and unrelated files/processes remain outside project scope. Approved main protection and temporary artifact cleanup are recorded in governance evidence. Actual PR/main, hosting and tag/Release publication are verified independently below.

## Actual GitHub and production verification

Version 0.2.0 [PR #11](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/pull/11) has a [successful final PR CI run](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38345775927) and a separate [successful main CI run](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38346046807). Each passed **100/100 unit and 17/17 Linux Chromium browser tests**. [Final PR artifact inspection](v020-pr-final-validation.json) and [main inspection](v020-main-ci-validation.json) verified ZIP digests, exact source/file inventories, report bytes, deliberate retention and clean selected JSON reports. Twelve screenshots include six cockpit captures; passing runs produced no failure traces.

The [Pages deployment](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38346244271) succeeded from the exact tested main artifact; [Netlify production](https://app.netlify.com/sites/cobalt-instrument-studio/deploys/6acdb1c6ed38ff1edec513e4) is ready at the same source. [Production HTTP/deployment evidence](v020-production-validation.json) confirms four built assets per origin and exact report bytes. [Public Edge browser checks](v020-production-browser.json) passed **17/17 per site**, with 30 device and 18 application layout combinations, no JavaScript errors, and observed wall times of 44.458 s on Netlify and 47.480 s on Pages. These are observations, not performance guarantees.

The published **Gauges, Engine, Trends, Faults, and ACK** pages use a graphite/black bezel, metallic rings, blue/cyan accents, shared softkeys and large white readouts. Trends uses accepted history and ACK invokes central diagnostics. Standby initial/reset readouts show zero in either unit system; Start or guided Run reveals accepted values and Pause holds them. These zeros never enter samples, diagnostics, or history. Local, CI and public lifecycle checks passed.

The [annotated v0.2.0 tag](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/tree/v0.2.0) points to verified main `5e7615a98478ae14301da4377c9e6a2255cd2139`. Its [release workflow](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38346481631) passed all three jobs and published one [v0.2.0 Release](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/releases/tag/v0.2.0). [Inspection evidence](v020-release-validation.json) verified notes, five downloaded attachments, checksums, all 14 static archive files and matching embedded reports. [Netlify](https://cobalt-instrument-studio.netlify.app/) remains primary and [Pages](https://cloudwizardboricua.github.io/cobalt-instrument-studio/) the backup.

Verified downloads: [PDF](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/releases/download/v0.2.0/Cobalt_Engineering_Report.pdf), [DOCX](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/releases/download/v0.2.0/Cobalt_Engineering_Report.docx), [static builds](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/releases/download/v0.2.0/Cobalt_Static_Build_v0.2.0.tar.gz), [manifest](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/releases/download/v0.2.0/release-manifest.json), and [SHA-256 checksums](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/releases/download/v0.2.0/SHA256SUMS.txt). The reports retain their frozen local checkpoint while these later remote receipts are recorded separately.

The earlier merged [PR #1](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/pull/1), [92/12 PR artifacts](workflow-pr-validation.json), [HTTP/deployment](workflow-production-validation.json), and [12/12 public browser checks](workflow-production-browser.json) remain historical. [Main protection and approved artifact cleanup](workflow-governance-validation.json) are verified. The [v0.1.0 Release](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/releases/tag/v0.1.0), [earlier public browser](public-browser-validation.json), [public HTTP](public-http-validation.json), and [release record](release-validation.json) are unchanged. [DevOps handoff](DEVOPS_HANDOFF.md) connects the full workflow evidence.
