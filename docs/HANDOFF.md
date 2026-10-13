# Engineering and publication handoff

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
| Remote GitHub Actions CI                  | 32 unit tests and 7 browser tests passed on Linux with Chromium.                                                                                                         |
| GitHub Pages workflow                     | Deployment workflow passed.                                                                                                                                              |
| Tagged release workflow                   | Annotated `v0.1.0` triggered a passing workflow with 32 unit and 7 browser tests; exactly one release was created.                                                       |
| Release notes and report attachments      | Published notes matched the reviewed notes; anonymous downloads of both attachments matched local report bytes.                                                          |
| `node scripts/validate-static-builds.mjs` | Both root and project-base production builds passed local browser checks.                                                                                                |
| Direct report requests                    | HTTP 200 for nonempty PDF and DOCX on both local build paths; downloaded bytes matched source artifacts.                                                                 |
| Public HTTPS and reports                  | Both hosted HTML entries, referenced assets, source links, observed README, and direct PDF/DOCX requests passed; report bytes matched local artifacts.                   |
| Local production browser paths            | Six gauges, overheat critical state, timeout/recovery, 240-sample cap, 390 px layout, refresh, and no external runtime requests passed.                                  |
| Live production interactions              | Both origins passed six changing gauges, credit, mode/speed/load, Start/Pause/Reset, all guided replays, acknowledgment, and timeout/recovery.                           |
| Live production mobile and console        | All three views fit a 390 px viewport without horizontal overflow on both origins. Observed error-level console logs were empty.                                         |
| Privacy review                            | Restricted project identities absent from text/report contents; document author fields blank; actual screenshots reviewed.                                               |
| Workflow configuration                    | Three YAML files parsed; critical job dependencies and permissions checked. Netlify TOML parsed. Correct release version accepted and an incorrect tag rejected locally. |
| PDF                                       | Seven pages rendered and inspected; a crowded footer was corrected.                                                                                                      |
| DOCX layout                               | Seven pages rendered and inspected with the approved isolated renderer; an extra blank page was corrected.                                                               |

Guided automated browser checks use a controlled clock. Separate real-time local and production checks observed updates and pause behavior; production guided replays ran with actual wall-clock timing. Exact measurements and hashes are in [validation evidence](validation-evidence.json), [hosting build validation](hosting-build-validation.json), [public browser validation](public-browser-validation.json), [public HTTP validation](public-http-validation.json), and [release validation](release-validation.json). No physical iPhone/cellular-network test, heap, frame-rate, hardware, public-uptime, Safari/Firefox, or long-duration browser-soak measurement is claimed.

## Deliverables

- [README and actual screenshot](../README.md)
- [Engineering report PDF](Cobalt_Engineering_Report.pdf)
- [Shared report source](report-source.json)
- [Editable engineering report DOCX](Cobalt_Engineering_Report.docx)
- [15 prioritized potential improvements with benefit and complexity](ROADMAP.md)
- [Changelog](../CHANGELOG.md)
- [Verified hosting and release process](DEPLOYMENT.md)
- [Published v0.1.0 release and report attachments](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/releases/tag/v0.1.0)

Reports are synchronized into both static build outputs. The site links use the correct build base. Source files are formatted for inspection. The original supplied prompt document is preserved outside this dedicated project.

## Publication checkpoint

The [public repository](https://github.com/CloudWizardBoricua/cobalt-instrument-studio) is published with default branch `main`. The [Netlify primary demo](https://cobalt-instrument-studio.netlify.app/) and [GitHub Pages backup](https://cloudwizardboricua.github.io/cobalt-instrument-studio/) are anonymously accessible over HTTPS. Both hosted applications operate without the development computer remaining on.

The [CI run](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38331306537) and [Pages deployment run](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38331306485) passed for the final report commit, and its Netlify deployment was ready. Both origins also passed the live controls, guided scenarios, source link, and mobile layout checks listed above. Updated report downloads matched the final local artifacts. The Netlify-injected badge was inspected separately from the application build.

Repository-local commits use the approved author and a GitHub noreply address; global Git identity was not changed. The new Netlify site's anonymous access was enabled without changing team defaults, billing, the Free plan, or automatic top-up. Repository access uses a scoped read-only deploy key and a push webhook.

The annotated `v0.1.0` tag identifies commit `3b556c6d509b39301549af2e0ee2ade69d4495c5`. Its [source tree](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/tree/v0.1.0), [passing release workflow](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38331500958), and [published release](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/releases/tag/v0.1.0) were verified. Exactly one Actions-created release exists, with the reviewed notes and two anonymously verified report attachments. Physical cellular access, long-term hosting availability, and future provider usage limits remain follow-up considerations.
