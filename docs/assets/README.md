# Engineering diagrams and retained captures

These assets illustrate the simulator and its historical verification checkpoints in the root README, engineering reports and technical guides. They are documentation resources, not live telemetry or source code. [Documentation index](../README.md)

```mermaid
flowchart LR
  Browser[Deliberate browser capture] --> Images[Retained PNG evidence]
  Diagrams[Authored SVG illustrations] --> Guides[README and technical guides]
  Images --> Guides
  Images --> Reports[Engineering report generation]
```

```text
assets/
├── README.md                    # Asset roles and capture limitations
├── architecture.svg             # Simulator architecture illustration
├── banner.svg                   # Project visual identity
├── dashboard-desktop.png        # Earlier desktop instrument dashboard capture
├── dashboard-mobile.png         # Earlier phone-width dashboard capture
├── device-cockpit-ack.png        # Device acknowledgment preview page
├── device-cockpit-engine.png     # Device Engine preview page
├── device-cockpit-faults.png     # Device fault-list preview page
├── device-cockpit-gauges.png     # Device gauges preview page
├── device-cockpit-mobile.png     # Narrow device/standby preview
├── device-cockpit-trends.png     # Accepted-history trend preview page
├── demo-audit-start.png          # Fresh narrow Netlify standby observation
├── demo-audit-scenario.png       # Fresh explicit scenario draft and Run control
├── demo-audit-recovery.png       # Fresh recovered delivery with retained evidence
├── demo-audit-workspace.png      # Fresh Engine/softkey/property viewport excerpt
├── demo-audit-pages.png          # Fresh desktop Pages standby observation
├── device-workspace-engine.png  # Workspace and unapplied label draft
├── diagnostics-mobile.png       # Narrow diagnostics/condition evidence
├── oil-pressure-mobile.png      # Guided oil-pressure-loss evidence
├── readme-dashboard.png         # Current desktop toolbar and six nonzero gauges
├── readme-device.png            # Current expanded Engine preview with nonzero readings
├── readme-diagnostics.png       # Current simulated coolant critical alert and transitions
├── readme-workspace.png         # Current signal browser, Engine preview and default properties
├── rejected-sample-desktop.png  # Rejected telemetry/retained-values evidence
└── workspace-desktop.png        # Display properties and accepted-data workspace
```

The [component guide](../../src/components/README.md) explains the rendered surfaces; [DESIGN_QA.md](../DESIGN_QA.md) describes the earlier device-page comparison and its limitations. New Product Design observations belong in [DEMO_USABILITY.md](../DEMO_USABILITY.md), with their own fresh captures, instead of silently replacing the old report images.

From the project root, `npm run test:e2e` captures selected screens and measurements and `npm run verify:static -- --skip-build` exercises the two completed builds. These commands can overwrite approved PNG paths. Review generated images before deliberately updating documentation; a test pass does not automatically justify replacing historical evidence. `npm run verify:privacy` checks text but cannot establish the privacy or visual correctness of PNG contents.

Demo talking point: screenshots show what a browser rendered at a known checkpoint. The device bezel and gauges are a browser preview; they do not demonstrate firmware, hardware connectivity, touch-panel qualification or physical alarm behavior. In `device-workspace-engine.png`, the edited label is an unapplied draft.

The four `readme-*.png` files are fresh, unedited captures of the current local simulator in an isolated Microsoft Edge context, using a 1440 × 1100 viewport, the default night theme, reduced motion and a controlled clock. The dashboard, workspace and focused Engine preview show **Normal operating ramp paused at 28 simulated seconds**, with nonzero readings from the same accepted sample; the workspace retains the default applied slot-1 properties (Engine speed, 0–3600 rpm). Diagnostics shows **Coolant overheat paused at 35 simulated seconds**, with an unacknowledged critical condition and its normal → warning → critical event history. All four saved images were visually inspected; the capture observed no JavaScript errors or HTTP error responses. These local presentation assets preserve the earlier images and establish no new hosted-deployment or hardware evidence.
