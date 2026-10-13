# Cobalt device display visual verification

Developed by Daren Diaz · [GitHub](https://github.com/CloudWizardBoricua/cobalt-instrument-studio)

Fall 2026 · Version 0.2.0

**Findings**

- Resolved P2: the earlier embedded Engine readout was about 35 px. Container-based sizing now keeps the main dial at least 44 px at all tested widths; the final Engine capture shows a clear large white reading inside the metallic rim.
- Resolved P2 in evidence capture: keyboard focus exposed the fixed skip link over the mobile capture. The final screenshot moves focus to the preview heading before capture. Keyboard focus remains available and visible during actual navigation.
- No remaining P0, P1, or P2 findings in the reviewed scope. A compact single-row softkey layout on very narrow screens is a possible P3 refinement; the current wrapped controls remain reachable.

**Comparison target and evidence**

The user supplied a physical display reference and explicitly requested blue styling, the existing simulator, and working device pages. The reference is retained privately as `.local/reference-device-display.png`. It and the final Engine screenshot were opened together in one comparison input. This is an adaptation of its metallic dial, strong central number, segmented indicators, and dark enclosure; it is not a pixel clone of the photographed product. Brand text, speed units, exact enclosure proportions, and red accents are intentionally replaced by Cobalt's identity, actual simulated RPM, responsive browser controls, and blue/cyan styling.

Actual captures are [Engine](docs/assets/device-cockpit-engine.png), [Gauges](docs/assets/device-cockpit-gauges.png), [Trends](docs/assets/device-cockpit-trends.png), [Faults](docs/assets/device-cockpit-faults.png), [ACK](docs/assets/device-cockpit-ack.png), and [mobile standby](docs/assets/device-cockpit-mobile.png). Desktop captures use a 1440 × 1100 CSS viewport; mobile uses 390 × 1000, with device scale 1. Element captures exclude browser chrome. The product photograph and browser device have different natural aspect ratios; frame composition is compared with that intentional responsive difference stated.

**Required fidelity surfaces**

- Typography: large white monospaced values preserve the reference's number-first hierarchy. Cobalt retains its established local system fonts. No font download is required. Labels, units, and condition text remain readable without truncation in the reviewed captures.
- Spacing and layout: the central dial, segmented flanks, graphite frame, and physical-looking softkeys retain the requested structure. Engine cards stack on mobile; tabs and softkeys wrap at narrow widths. Automated checks passed all 30 page/theme/width combinations at 1440, 390, and 320 px with no horizontal overflow.
- Colors and tokens: blue/cyan accents, metallic gray, white text, and dark surfaces replace the reference's red decoration. Fault states include explicit words and icons; preview warning/critical accents use amber/orange. Day and night keep a dark device face within the application's selected theme.
- Assets and image quality: the photographed product is a visual reference, not an asset placed in the application. These are functional instruments using the project's existing native gauge/chart approach, with real accepted readings and library icons. No borrowed product branding, fake raster gauge, or placeholder image appears in the interface. The final screenshots are sharp browser captures.
- Copy and content: Cobalt Display and SIMULATED remain visible. Neutral Design concept attribution and the developer's adjacent GitHub link are preserved. Standby, pause, stale delivery, rejection, acknowledgment, escalation, and recovery are stated explicitly.

**Interaction verification**

All 100 unit and 17 browser tests passed locally. Device navigation supports arrow keys, Home/End, tabs, and softkeys. ACK uses the central diagnostics pipeline; invalid deliveries preserve accepted values and chart gaps. Initial/reset readings are literal zero even in metric mode; Start or Run reveals accepted readings and Pause retains them. These checks establish browser simulation behavior, not equipment integration or physical-device certification.

**Final result: passed**
