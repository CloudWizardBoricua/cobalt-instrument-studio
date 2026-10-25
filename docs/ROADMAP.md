# HMI product roadmap

_Developed by Daren Diaz_ · [GitHub repository](https://github.com/CloudWizardBoricua/cobalt-instrument-studio)

Fall 2026

**Current product: SIMULATED — NOT LIVE EQUIPMENT.** The repository implements a browser simulator and display-design workspace. It has no equipment driver, backend service, authenticated operator, durable historian, or installed HMI runtime. Everything below the baseline is proposed engineering work, not an implemented or certified capability.

The first proposed product monitors one equipment source and lets an operator acknowledge HMI alarms. It runs locally on a Windows industrial PC with Microsoft Edge, a C#/.NET gateway, the existing React/TypeScript frontend, and SQLite storage. It must start and operate without internet access. Acknowledgment records operator review; it does not clear an active condition, reset equipment, or write to a controller. Hardware and the first protocol remain unselected; CAN/J1939 is a candidate only.

Read the [proposed HMI architecture](HMI_ARCHITECTURE.md) for component responsibilities, interfaces, deployment, and failure behavior. The [README](../README.md) is the entry point for the current demo. This roadmap orders work by dependencies and measurable exit gates rather than promising dates.

## Repository review findings

The planning review inspected clean main **b92b1f736aa2bab91438ba687fa7b31d64748bf1** and confirmed that it matched remote main at that point. These observations are a planning snapshot, not a continuing assertion about main, dependency advisories, or deployed sites.

| Area | Observed baseline | Consequence for the plan |
| --- | --- | --- |
| Application | Seeded simulation, validated telemetry, bounded history/events, alarm acknowledgment and five device-preview pages | Preserve the deterministic demo as a regression fixture and training mode. |
| Local checks | TypeScript, workflow verification, and privacy/content verification passed; the latter inspected 108 text files | Re-run relevant checks for each implementation change rather than inheriting these results. |
| Unit tests | The initial run passed 98 of 100 tests. One Windows junction fixture failed during sandbox setup; its isolated three-test suite subsequently passed. One workflow fixture failed because an LF-only replacement did not match the CRLF checkout | Fix fixture portability before using a green baseline as a phase gate. Do not describe the initial full suite as passing. |
| Dependency review | The audit reported three development-package entries: two critical and one moderate across Vitest, @vitest/mocker, and tinypool. The production-only audit reported zero entries | Evaluate the advisory chain, update compatible tooling, and re-run checks. Exploit reachability was not established, and zero reported production entries is not a security guarantee. |
| Delivery | Locked installs, pinned Actions, restricted workflow permissions, artifact hashes, and release archive verification already exist | Extend this tested-artifact process to the installed product. |
| Hosting | GitHub Pages uses the successful CI artifact; Netlify rebuilds main separately | Public demo hosting remains distinct from the offline HMI runtime. |

Source anchors: [workflow fixture](../tests/workflows.test.ts#L113), [junction fixture](../tests/ci-reports.test.ts#L147), [workflow privacy gate](../scripts/verify-config.mjs#L180), [CI](../.github/workflows/ci.yml), and [deployment process](DEPLOYMENT.md).

The existing [v0.2.0 local evidence](validation-evidence.json), [main CI evidence](v020-main-ci-validation.json), [release receipts](v020-release-validation.json), and [engineering reports](../README.md#reports-and-publication-evidence) remain frozen historical checkpoints. The planning review did not re-run the browser suite, hardware tests, or deployment verification. Historical counts and screenshots must not be presented as evidence for the proposed HMI.

## Integration requirements

Agree versioned interfaces and shared acceptance fixtures before connecting frontend and backend implementations. Bind validation evidence to the tested revision and record failures and limitations explicitly. Each phase requires integrated evidence against its acceptance criteria; a passing component test does not substitute for the end-to-end gate.

## Six delivery phases

### Phase 0 — Establish a dependable baseline

**Dependency:** None.

- Normalize workflow fixture input or make its mutations newline tolerant; assert that negative-test mutations actually change the fixture. Exercise LF and CRLF inputs.
- Make the junction-dependent test's environment requirement explicit and preserve its outside-project protection assertion. Validate it on a supported Windows runner instead of treating an unsupported setup as a product defect.
- Review the reported development dependency chain, choose compatible remediations, and verify the lockfile and test behavior. Document any remaining advisory disposition without assuming development tools are unreachable.
- Separate routine generated test captures/reports from deliberate updates to committed documentation evidence. Keep historical release receipts stable.
- Record supported development runtimes and add a Windows check alongside the existing Linux pipeline. Retain immutable Actions, privacy preparation, and existing release integrity checks.

**Exit gate:** The full unit suite and existing type/workflow/privacy checks pass on supported Windows and Linux environments; the negative workflow test proves the intended mutation on both line endings; advisory findings are remediated or explicitly reviewed; ordinary validation leaves tracked evidence unchanged. Browser/build verification is executed on the implementation revision before baseline sign-off.

### Phase 1 — Define contracts and discover the target

**Dependency:** Phase 0.

- Establish a live-source boundary alongside the simulator. Use a fixture source first so frontend and service development do not depend on obtaining hardware.
- Define versioned telemetry, device identity, boot/session identity, sequence ordering, signal units and quality, source versus receive time, alarm events, acknowledgment results, and configuration revisions. Preserve the existing simulator contract as a separate supported input.
- Agree the initial one-device monitoring and HMI-acknowledgment behavior, including reconnect/resynchronization and authoritative service state. Share valid and invalid fixtures across TypeScript and C# tests.
- Record the target discovery checklist: PC/OS/browser versions, display and input devices, physical interface, vendor data definitions, calibration, nominal update rates, fault behavior, installation permissions, and environmental limits.
- Define the pilot acceptance profile: telemetry-age limits, disconnect detection, retention/storage budgets, rendering and resource budgets, boot/recovery targets, and the hardware test procedure. Unknown hardware details remain explicit blockers for Phase 4.

**Exit gate:** Reviewed contracts and fixtures cover duplicates, ordering, a restarted source, invalid values/units, missing data, and recovery. Both languages produce the same acceptance results. The target checklist and measurable pilot profile are recorded, with unresolved equipment choices documented as prerequisites for hardware integration.

### Phase 2 — Connect the frontend to a local gateway

**Dependency:** Phase 1 contracts.

- Build the .NET service with the fixture adapter and expose the proposed read/stream interfaces. Serve the React production frontend locally; this phase is a development prototype until Phase 3 authorization is complete.
- Keep demo controls within simulation mode. In connected mode, show the selected source, connection state, data quality and last accepted values; unavailable readings must not become apparently valid zero measurements.
- Make service-side acquisition, freshness and alarm evaluation independent of a browser tab or UI pause. Bound queues and UI history; reconnect with a fresh authoritative snapshot and visible gap handling.
- Keep the accepted-sample isolation already exercised by the demo: rejected input must not refresh displayed values or hide communication failure. Exercise intermittent delivery, bursts, jitter and interacting faults with fixtures.
- Preserve keyboard navigation, textual alarm states, reduced motion and readable target-display layouts while decoupling display components from simulator state.

**Exit gate:** End-to-end tests demonstrate fixture telemetry, rejected input, stale/disconnected states, reconnection, source restart and browser reload. A hidden or paused browser does not stop service freshness/alarm processing. The offline demo still produces its deterministic scenarios.

### Phase 3 — Make operation durable and accountable

**Dependency:** Phase 2.

- Persist retained telemetry, alarm lifecycle, acknowledgments and configuration in SQLite with migrations, bounded retention, backup/restore and explicit storage-failure behavior.
- Add local operator authentication and roles for viewing, acknowledgment and configuration; keep credentials and authorization decisions in the service. Provisioning and routine operation must work offline.
- Record actor, timestamp, target alarm occurrence and result for acknowledgments. Make retries safe, retain active conditions after acknowledgment, and require fresh acknowledgment after escalation according to the reviewed policy.
- Version and validate saved display configurations and alarm policies. Audit changes and reject conflicting or invalid updates without partially applying them. Include bounded layout import/export with migration checks.
- Review alarm thresholds, debounce, hysteresis, nuisance-alarm behavior and acknowledgment responsibilities against the selected use case. Notification routing remains a later extension unless explicitly needed for the pilot.

**Exit gate:** Tests prove unauthorized operations are rejected by the service; duplicate/stale acknowledgment attempts are handled consistently; actor attribution and state survive restart; invalid configuration cannot partially apply; retention, disk-full handling, backup/restore and migration recovery meet the recorded profile. No physical write path exists.

### Phase 4 — Integrate one read-only hardware source

**Dependencies:** Phase 3 and confirmed hardware/protocol information from Phase 1.

- Select one supported interface and driver from actual equipment documentation and available hardware. Do not implement several speculative adapters or label CAN/J1939 as supported before this gate.
- Map real measurements into the agreed contract, including documented identity, units, calibration, invalid/sentinel values, timing and diagnostic quality. Record any limits of the source's identity or authentication capabilities.
- Restrict the adapter to acquisition and diagnostics required for monitoring. HMI acknowledgment must remain distinct from equipment acknowledgment, reset, configuration and actuation commands.
- Compare displayed readings and alarm transitions against controlled hardware measurements. Test unplug/reconnect, power cycle, corrupt/delayed frames, wrong device/configuration and simultaneous fault conditions where the test setup supports them.
- Verify physical input, touch targets, screen readability and assistive-technology behavior on the selected Windows/Edge target; retain evidence of untested conditions.

**Exit gate:** Hardware-in-the-loop evidence identifies the exact device, adapter, firmware, mapping and tested revision; measured behavior meets the target profile; read-only behavior is demonstrated; fault/recovery results are reviewed. Passing simulation fixtures alone cannot satisfy this gate.

### Phase 5 — Package and prove an installed offline pilot

**Dependency:** Phase 4.

- Install the .NET gateway as a supervised Windows service with a restricted service identity, automatic startup, local UI assets and documented Edge launch behavior. Keep installation/configuration/data locations explicit.
- Add local health diagnostics, rotating logs and a support bundle that removes private information. Track telemetry age, rejection/reconnect counts, acquisition/service health, resource use and storage capacity independently.
- Package versioned frontend/service/database compatibility together. Extend the existing tested-artifact pipeline with dependency/license inventory, SBOM, signed delivery artifacts, integrity verification, installation smoke tests and a proven update/rollback path.
- Exercise cold boot without internet, service/browser restart, network and hardware loss, abrupt shutdown, storage exhaustion, backup/restore and failed update recovery. Run the recorded soak and performance profile on the actual target PC.
- Complete operating, maintenance, recovery and incident runbooks. Select a project license and include applicable third-party notices before distributing the product.

**Exit gate:** A clean target PC installs and boots into a working offline pilot; data and accountable acknowledgments survive the specified failure tests; measured resource/latency/retention results meet the profile; support and rollback procedures work from the shipped package. Record outstanding risks and operator sign-off before a field pilot. This is not a safety certification claim.

## Original improvement themes, redistributed

All 19 themes from the earlier roadmap remain represented. Their order now reflects the chosen local monitoring product rather than a generic priority list.

| Earlier theme | Delivery placement |
| --- | --- |
| Real gateway and fieldbus adapter | Fixture gateway in Phase 2; one selected driver in Phase 4. |
| Calibrated device schema and identity | Contract work in Phase 1; measured mapping in Phase 4. |
| Hardware in the loop validation | Required Phase 4 exit gate. |
| Connectivity security and isolation | Boundary in Phase 1, operator authorization in Phase 3, hardware/installation verification in Phases 4–5. |
| Safari, Firefox, and physical mobile testing | After the Windows/Edge pilot; add only with an explicit supported-target expansion. |
| Formal accessibility audit | Target-specific review in Phase 4; carry any unresolved issues into pilot readiness. |
| Jitter, intermittent, and simultaneous faults | Fixture coverage in Phase 2, available physical cases in Phase 4. |
| Durable multi-session history | SQLite retention and recovery in Phase 3. |
| Validated alarm policy and routing | Local policy in Phase 3; external routing after the pilot. |
| Accountable configuration audit | Roles, revisions and durable audit in Phase 3. |
| Multiple independent device streams | After the one-device pilot; require isolation and capacity tests before expansion. |
| Versioned layout import/export and persistence | Validated durable layout configuration in Phase 3. |
| Authorized equipment configuration transactions | Separate future control project with permissions, hazards, transaction/recovery behavior and hardware validation. |
| Additional widgets and layout editing | After core monitoring and target usability pass; preserve bounded rendering and keyboard operation. |
| Target display runtime/export | Windows/Edge installation in Phase 5; embedded exports and alternate runtimes remain later work. |
| Long-session performance profiling | Budgets in Phase 1, measured target soak in Phase 5. |
| Release provenance and rollback safeguards | Dependency/test baseline in Phase 0, installed-package evidence in Phase 5. |
| Production observability and service objectives | Measurable profile in Phase 1, local monitoring/runbooks in Phase 5; cloud fleet monitoring later. |
| Calibrated simulation models | After measured equipment data exists; characterize error bounds and retain deterministic regression fixtures. |

Linux packaging, cloud services, remote fleet management, equipment controls and certification are outside the first pilot. Each requires a separate reviewed scope and acceptance evidence. Documentation work does not implement these capabilities, fix the identified tests, update dependencies, or alter the frozen engineering reports.
