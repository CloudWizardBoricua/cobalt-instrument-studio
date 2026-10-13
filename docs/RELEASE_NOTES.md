# Cobalt Instrument Studio 0.2.0

_Developed by Daren Diaz_ · [GitHub repository](https://github.com/CloudWizardBoricua/cobalt-instrument-studio)

Fall 2026

This second engineering release preserves the seeded simulator and makes device behavior, rejected telemetry, and the development workflow inspectable.

Telemetry is simulated. No hardware interface, live equipment access, backend, safety control, authentication, certification, or production guarantee is provided.

The device workspace provides Gauges, Engine, Trends, Faults, and ACK pages, shared softkeys, accepted-sample trends, central alert acknowledgment, a six-signal browser, and display-only properties. Its graphite bezel, metallic rings, cobalt blue/cyan accents, and large white readouts retain Cobalt's blue visual identity. Layout remains session-only; no target-device runtime or export is implemented.

Initial and reset gauge readouts show zero in display standby, including metric mode. Start or guided Run reveals the central accepted readings; Pause holds them. Standby zero placeholders never become accepted samples or change model, diagnostics, or history.

A versioned telemetry boundary rejects malformed, nonfinite, implausible, duplicate, and out-of-order deliveries without replacing valid readings or hiding their age. Five deterministic scenarios include oil-pressure loss and invalid sample delivery alongside normal ramp, overheat, and communication loss. Hysteresis, debounce, acknowledgment, bounded history/events, preferences, and simulated CSV remain available.

The existing CI, Pages, and release workflows now use locked installs, named checks, verified action commits, deliberate retention, and tested artifacts. Main protection requires PRs and strict CI from GitHub Actions, enforces administrators and conversation resolution, and blocks force pushes/deletions; required reviewer approvals are zero. Automatic Git metadata capture is disabled and retained test reports are sanitized before upload, including after failures.

Final local validation passed 100 unit tests and 17 browser tests, with 30 device-page/theme/width combinations and no JavaScript errors. The engineering report and validation evidence record measured outcomes. The release workflow reruns required checks, packages tested root/project builds, verifies PDF/DOCX copies, and publishes one Release with a static archive, manifest, and SHA-256 checksums. Actual run and checksum details are appended by that workflow.

Remaining gaps include cross-browser/physical-device coverage, long-duration profiling, persistent validated layouts, real gateway/CAN integration, calibrated equipment data, safety analysis, and production monitoring. The existing v0.1.0 tag and its historical assets are preserved.

The workflow appends the successful verification run and attachment checksums. Production access and downloaded bytes are verified separately; no uptime or physical-device guarantee is implied.
