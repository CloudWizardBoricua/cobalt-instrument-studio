# Engineering roadmap

_Developed by Daren Diaz_ · [GitHub repository](https://github.com/CloudWizardBoricua/cobalt-instrument-studio)

Fall 2026

The completed work below belongs to the local, unreleased hardening revision. Future items are specific engineering proposals, not implemented equipment capabilities. Complexity is relative: Small = focused work, Medium = multiple components, Large = substantial integration or validation.

## Implemented in the local revision

| Improvement                       | Implemented boundary                                                                         | Engineering value                                                           |
| --------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Versioned telemetry contract      | Required finite numeric fields, plausibility bounds, version and timestamp validation        | Protects accepted instruments/history from invalid delivery                 |
| Rejection and recovery evidence   | Rejection counts, reason deduplication, freshness from last accepted time, bounded events    | Explains retained values and delivery recovery without message floods       |
| Oil pressure loss replay          | Deterministic decline, warning/critical progression, acknowledgment and recovery             | Exercises a process fault and lower-threshold clearing                      |
| Invalid sample replay             | Controlled malformed, duplicate, and out-of-order delivery attempts                          | Exercises data quality independently of physical process behavior           |
| Device workspace                  | Six-slot accepted-data preview, signal browser, atomic display-property editor               | Demonstrates original display configuration without affecting engine/alerts |
| Accessibility/usability hardening | Keyboard focus, descriptions, non-color state cues, transition announcements, reduced motion | Improves the checked browser workflows; formal audit remains future work    |

## Prioritized future improvements

| Priority | Future improvement                              | Engineering benefit                                                                                                     | Complexity |
| -------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------- |
| P0       | Real gateway and fieldbus adapter               | Validate framing and device input before replacing generated transport; CAN/J1939 is only a candidate                   | Large      |
| P0       | Calibrated device schema and identity           | Add validated units, clock origin, sequence numbers, device identity, calibration, and schema migration for field data  | Large      |
| P0       | Hardware in the loop validation                 | Measure sensor ranges, faults, timeout behavior, and recovery against controlled physical equipment                     | Large      |
| P0       | Connectivity security and isolation             | Authenticate devices, protect messages, manage credentials, and isolate display software from safety controls           | Large      |
| P0       | Safari, Firefox, and physical mobile testing    | Verify rendering, scheduling, input, storage, and downloads beyond local Chromium browsers                              | Medium     |
| P0       | Formal accessibility audit                      | Validate contrast, zoom, screen readers, touch targets, and complete keyboard order with assistive technology           | Medium     |
| P1       | Jitter, intermittent, and simultaneous faults   | Test delivery delay, repeat bursts, sensor intermittency, and interacting process faults beyond five guided replays     | Medium     |
| P1       | Durable multi-session history                   | Introduce retention, integrity, and timestamp semantics for stored measurements                                         | Large      |
| P1       | Validated alarm policy and routing              | Review nuisance alarms, escalation, rate limits, acknowledgment responsibilities, and delivery evidence                 | Large      |
| P1       | Accountable configuration audit                 | Record reviewed display/rule changes, actor identity, and immutable references in a future connected system             | Large      |
| P1       | Multiple independent device streams             | Prevent mixing accepted samples, diagnostics, layout, and settings between validated identities                         | Large      |
| P1       | Versioned layout import/export and persistence  | Validate portable session display configurations, migrations, size limits, and fallback                                 | Medium     |
| P1       | Authorized equipment configuration transactions | Add explicit command boundaries, permissions, confirmation, rollback, and hardware validation before any physical write | Large      |
| P2       | Additional widgets and layout editing           | Support reviewed trend/numeric widgets and bounded drag/resize behavior while retaining readable keyboard controls      | Medium     |
| P2       | Target display runtime/export                   | Translate validated layouts to an independently supported target with compatibility checks                              | Large      |
| P2       | Long-session performance profiling              | Measure heap, render cost, background throttling, and lower-powered device behavior                                     | Medium     |
| P2       | Release provenance and rollback safeguards      | Add dependency review, protected deployment, signed provenance, post-deploy checks, and rollback evidence               | Medium     |
| P2       | Production observability and service objectives | Define measurable availability, delivery quality, incident recovery, and provider monitoring                            | Large      |
| P2       | Calibrated simulation models                    | Replace explanatory kinetics with characterized equipment relationships and documented error bounds                     | Large      |

There are **19 specific future improvements**. Priority reflects dependencies, not a timeline or certification promise. Publication of the reviewed local revision requires separate authorization.
