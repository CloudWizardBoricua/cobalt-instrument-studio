# Potential future engineering improvements

_Developed by Daren Diaz_

Every item below is planned work. None provides a current hardware or production capability. Complexity is a rough relative estimate: Small = focused work, Medium = multiple components, Large = substantial integration or validation.

| Priority | Future improvement                            | Engineering benefit                                                                                                                                         | Complexity |
| -------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| P0       | Real gateway and fieldbus adapter             | Replace simulated sample transport with a separately validated interface; CAN/J1939 is a hypothetical candidate, not an implemented protocol.               | Large      |
| P0       | Validated telemetry schema                    | Specify units, timestamps, sequence numbers, device identity, validity, and compatibility before accepting field data.                                      | Medium     |
| P0       | Hardware in the loop testing                  | Verify timeouts, faults, calibration, sensor ranges, and recovery against controlled physical equipment.                                                    | Large      |
| P0       | Security hardening for real connectivity      | Authenticate devices, validate messages, manage credentials, and isolate the display from safety controls.                                                  | Large      |
| P0       | Expanded end to end and cross browser testing | Cover Safari, Firefox, actual mobile devices, keyboard use, background throttling, and network impairment.                                                  | Medium     |
| P1       | Advanced fault injection                      | Add intermittent sensors, message jitter, corrupted samples, cooling degradation recovery, and simultaneous faults beyond the current three basic replays.  | Medium     |
| P1       | Historical storage                            | Preserve multi-session, timestamped measurements with retention rules and integrity checks; current history is memory only.                                 | Large      |
| P1       | Alert routing                                 | Deliver reviewed, rate-limited notifications with escalation and delivery evidence.                                                                         | Large      |
| P1       | Role based access                             | Separate read-only observation, configuration, and administrative rights in a future authenticated deployment.                                              | Large      |
| P1       | Audit trails                                  | Record accountable configuration changes, acknowledgments, identities, and immutable time references.                                                       | Large      |
| P1       | Multi device support                          | Track multiple validated streams without mixing samples, alerts, or configuration.                                                                          | Large      |
| P1       | Device configuration                          | Add authorized, validated configuration transactions with rollback and explicit safety boundaries.                                                          | Large      |
| P2       | Performance profiling                         | Measure long sessions, heap retention, rendering cost, background scheduling, and lower-powered devices.                                                    | Medium     |
| P2       | Formal accessibility audit                    | Audit contrast, screen readers, chart alternatives, keyboard order, zoom, and touch target sizes.                                                           | Medium     |
| P2       | Automated release safeguards                  | Extend the initial tag/version check with protected environments, dependency review, signed provenance, deployment rollback, and post-release smoke checks. | Medium     |

Priority is dependency order rather than a delivery promise. Production connectivity must follow schema, security, and hardware validation decisions. No timeline or certification is claimed.
