# Local engineering handoff

_Developed by Daren Diaz_

Fall 2026

The application and documentation are prepared as an independent instrumentation simulator. All data are explicitly simulated. No physical device, backend, authentication service, live equipment connection, safety control, or production certification is implemented.

## Implemented behavior

One fixed-step, seeded model drives RPM, oil pressure, coolant temperature, battery voltage, fuel level, and engine load. The interface includes four modes; functional Start, Pause, Reset, speed/load controls; three guided replays; selectable trends; validated settings; and local CSV exports. Display units, appearance, and visibility persist in this browser. History and event data remain bounded and memory only.

Default seed 27041 produced these observed transitions:

| Scenario           | Actual local observation                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Normal ramp        | At 35 simulated seconds, approximately 1749.8 rpm and 51.8 percent load; no default alert.                       |
| Coolant overheat   | Warning at 14.0 s and 223.5 degrees F; critical at 18.5 s and 236.8 degrees F. Escalation renews acknowledgment. |
| Communication loss | Final pre-gap sample at 4.5 s; timeout at 6.5 s; delivery and normal communication state restored at 17.0 s.     |

The model assumes pressure rises with RPM, temperature responds with inertia, charging voltage depends on speed/fault state, and fuel declines with load. Fault kinetics are accelerated. These assumptions are not hardware measurements. Pause suspends simulation time, including timeout age.

## Verification

| Command or check                          | Actual result                                                                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run typecheck`                       | Passed.                                                                                                                                                                  |
| `npm test`                                | 32 passed, 0 failed.                                                                                                                                                     |
| `npm run test:e2e`                        | 7 passed, 0 failed in Microsoft Edge Chromium.                                                                                                                           |
| `node scripts/validate-static-builds.mjs` | Both root and project-base production builds passed local browser checks.                                                                                                |
| Direct report requests                    | HTTP 200 for nonempty PDF and DOCX on both local build paths; downloaded bytes matched source artifacts.                                                                 |
| Production browser paths                  | Six gauges, overheat critical state, timeout/recovery, 240-sample cap, 390 px layout, refresh, and no external runtime requests passed.                                  |
| Privacy review                            | Restricted project identities absent from text/report contents; document author fields blank; actual screenshots reviewed.                                               |
| Workflow configuration                    | Three YAML files parsed; critical job dependencies and permissions checked. Netlify TOML parsed. Correct release version accepted and an incorrect tag rejected locally. |
| PDF                                       | Seven pages rendered and inspected; a crowded footer was corrected.                                                                                                      |
| DOCX layout                               | Seven pages rendered and inspected with the approved isolated renderer; an extra blank page was corrected.                                                               |

Guided browser checks use a controlled clock. A separate real-time smoke check observed live updates and pause behavior with no JavaScript page errors. Exact measurements and hashes are in [validation evidence](validation-evidence.json) and [hosting build validation](hosting-build-validation.json). No heap, frame-rate, hardware, public-uptime, Safari/Firefox, or long-duration browser-soak measurement is claimed.

## Deliverables

- [README and actual screenshot](../README.md)
- [Engineering report PDF](Cobalt_Engineering_Report.pdf)
- [Shared report source](report-source.json)
- [Editable engineering report DOCX](Cobalt_Engineering_Report.docx)
- [15 prioritized potential improvements with benefit and complexity](ROADMAP.md)
- [Changelog](../CHANGELOG.md)
- [Deployment and release plan](DEPLOYMENT.md)

Reports are synchronized into both static build outputs. The site links use the correct build base. Source files are formatted for inspection. The original supplied prompt document is preserved outside this dedicated project.

## Publication checkpoint

The dedicated local Git repository is prepared. Publication targets and author attribution have been confirmed. Public endpoint, remote CI, and release results are still pending. Repository-local commit attribution uses the approved author and a GitHub noreply email; no global identity was changed.

The authorized remaining operations are: create the new public repository; commit/push main; configure and publish GitHub Pages; create and publish the new Netlify production site; verify both sites anonymously; and only then push annotated `v0.1.0` so the prepared workflow publishes one release. Public URLs will be recorded after verification.

Netlify is the intended primary shareable endpoint; Pages is the independent backup. Both hosted applications would run without the development computer remaining on. Actual provider permissions, usage/credit limits, and anonymous access must be verified during publication.
