# Changelog

_Developed by Daren Diaz_ · [GitHub repository](https://github.com/CloudWizardBoricua/cobalt-instrument-studio)

## 0.2.0 — Fall 2026

Prepared for the approved second engineering release. Final local validation passed 100/100 unit and 17/17 browser tests, including standby, typography, 30 device-page combinations and the existing 18 application accessibility combinations, with no JavaScript errors. All nine PDF pages and nine DOCX pages passed visual inspection, and report metadata, dates, and repository links were checked. Actual version 0.2.0 GitHub publication remains pending. The earlier [PR #1](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/pull/1) checkpoint at main `453ea4a126fab0a44f4345871b401a5c11fbce86` passed 92 unit and 12 browser tests and both production checks. Initial v0.1.0 is unchanged.

- Added a version 1 telemetry acceptance boundary with required numeric fields, finite/plausible values, monotonic timestamps, duplicate/out-of-order rejection, and explicit reasons.
- Preserved last valid readings, sample age, history, and telemetry debounce across rejected deliveries. Added counted, deduplicated rejection episodes and accepted-delivery recovery evidence.
- Added deterministic oil pressure loss/recovery and invalid sample delivery/recovery scenarios; retained normal ramp, overheat, and communication loss.
- Added a six-slot device preview, accepted-signal browser, and selected-slot property editor across the three existing views. Display configuration is session-only and independent of engine/alert settings.
- Added Gauges, Engine, Trends, Faults, and ACK device-preview pages with shared navigation/softkeys, accepted-sample history, and central alert acknowledgment.
- Added a graphite/black cockpit bezel, metallic rings, cobalt blue/cyan accents, and large white readouts while preserving the central simulator and existing blue visual identity.
- Added display standby: initial/reset gauges show zero in either unit system; Start or guided Run reveals accepted readings and Pause holds them. The zero placeholders never enter the telemetry contract, model, diagnostics, or history.
- Improved keyboard focus, control and gauge descriptions, textual state cues, day/night readability, meaningful transition announcements, and reduced-motion behavior.
- Added meaningful contract, fault, device-property, and browser tests; updated local evidence, authentic screenshots, shared report source, and engineering PDF/DOCX.
- Added the public GitHub repository link beside developer attribution throughout the interface and authored project documentation.
- Added the neutral “Design concept” label to identify the application as an independent engineering demonstration.
- Earlier interface changes added a compact guided-scenario dropdown with an explicit Run scenario action; active progress and replay remain available.
- Improved the existing CI, Pages, and release workflows with lockfile installs, named verification steps, retained production/test artifacts, exact-run Pages deployment, shared release checks, tested static archives, and SHA-256 verification.
- Pinned official actions to verified immutable commits, minimized job permissions, and configured weekly npm/Actions dependency updates with the same PR checks.
- Added workflow, release, and project-content failure tests, README lifecycle evidence, and a reviewable DevOps handoff. The earlier DevOps checkpoint passed 92 unit and 12 browser tests locally and in Linux PR CI. The version 0.2.0 tag path is approved and awaits successful current CI and actual release execution.
- Verified main protection requiring PRs and strict CI checks from GitHub Actions, administrator enforcement, resolved conversations, and blocked force pushes/deletions.
- Recorded unnecessary Git contact metadata in temporary browser-test artifacts and verified approved removal of both affected artifacts while retaining production builds. Disabled automatic Git capture and added report sanitization with regression tests and a check before upload, including failing test runs.

Five-page functionality, standby, typography, the privacy correction, and both regenerated reports are implemented and checked locally. Remote CI, updated hosting checks, and the new annotated tag/Release must complete before publication is reported as verified.

## 0.1.0 — Fall 2026

Historical initial engineering build, hosted on Netlify/GitHub Pages and published as [v0.1.0](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/releases/tag/v0.1.0). This tagged snapshot does not contain the subsequent hardening and DevOps revision.

- Added one seeded model, six synchronized instruments, four modes, and bounded charts/events.
- Added normal ramp, overheat, and communication loss replays, thresholds, debounce, hysteresis, acknowledgment, and recovery.
- Added responsive Dashboard/Diagnostics/Settings, display preferences, local settings persistence, simulated CSV, reports, and two static hosting builds.
- Recorded passing local/remote checks. The Actions-created release passed 32 unit and 7 browser tests before creation; historical release evidence records matching notes and PDF/DOCX attachments.
