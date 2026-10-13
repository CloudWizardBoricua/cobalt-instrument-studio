# Changelog

_Developed by Daren Diaz_ · [GitHub repository](https://github.com/CloudWizardBoricua/cobalt-instrument-studio)

## Unreleased — Fall 2026

Engineering and DevOps revision approved for a reviewed feature branch push and substantive PR. Modified GitHub execution is pending. Main merge, production deployment, and a new tag/Release remain separately authorized; existing main sites and v0.1.0 are unchanged.

- Added a version 1 telemetry acceptance boundary with required numeric fields, finite/plausible values, monotonic timestamps, duplicate/out-of-order rejection, and explicit reasons.
- Preserved last valid readings, sample age, history, and telemetry debounce across rejected deliveries. Added counted, deduplicated rejection episodes and accepted-delivery recovery evidence.
- Added deterministic oil pressure loss/recovery and invalid sample delivery/recovery scenarios; retained normal ramp, overheat, and communication loss.
- Added a six-slot device preview, accepted-signal browser, and selected-slot property editor across the three existing views. Display configuration is session-only and independent of engine/alert settings.
- Improved keyboard focus, control and gauge descriptions, textual state cues, day/night readability, meaningful transition announcements, and reduced-motion behavior.
- Added meaningful contract, fault, device-property, and browser tests; updated local evidence, authentic screenshots, shared report source, and engineering PDF/DOCX.
- Added the public GitHub repository link beside developer attribution throughout the interface and authored project documentation.
- Added the neutral “Design concept” label to identify the application as an independent engineering demonstration.
- Earlier interface changes added a compact guided-scenario dropdown with an explicit Run scenario action; active progress and replay remain available.
- Improved the existing CI, Pages, and release workflows with lockfile installs, named verification steps, retained production/test artifacts, exact-run Pages deployment, shared release checks, tested static archives, and SHA-256 verification.
- Pinned official actions to verified immutable commits, minimized job permissions, and configured weekly npm/Actions dependency updates with the same PR checks.
- Added workflow, release, and project-content failure tests, README lifecycle evidence, and a reviewable DevOps handoff. The combined local revision passes 92 unit and 12 browser tests; modified workflows have not executed on GitHub.

## 0.1.0 — Fall 2026

Historical initial engineering build, hosted on Netlify/GitHub Pages and published as [v0.1.0](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/releases/tag/v0.1.0). This tagged snapshot does not contain the local hardening revision.

- Added one seeded model, six synchronized instruments, four modes, and bounded charts/events.
- Added normal ramp, overheat, and communication loss replays, thresholds, debounce, hysteresis, acknowledgment, and recovery.
- Added responsive Dashboard/Diagnostics/Settings, display preferences, local settings persistence, simulated CSV, reports, and two static hosting builds.
- Recorded passing local/remote checks. The Actions-created release passed 32 unit and 7 browser tests before creation; historical release evidence records matching notes and PDF/DOCX attachments.
