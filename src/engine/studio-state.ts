/**
 * Central session reducer connecting UI actions to the simulator and diagnostics.
 * App dispatches actions and schedules ticks; this module coordinates generated
 * values, validated received samples, bounded trend history, preferences, and
 * event evidence without depending on React or browser storage APIs.
 *
 * One shared state keeps the dashboard and device preview consistent. The
 * lifecycle distinguishes standby, running, paused, and reset sessions; guided
 * replay starts a fresh seeded session. These are demonstration controls, not
 * commands to live equipment. CSV exports contain retained simulated evidence,
 * with no durable historian, user identity, or industrial audit assurance.
 */
import {
  acknowledge,
  addEvent,
  createDiagnostics,
  updateDiagnostics,
} from "./diagnostics";
import { HISTORY_CAPACITY } from "./instruments";
import {
  advanceSimulation,
  clamp,
  createSimulation,
  setMode,
} from "./simulation";
import { defaultSettings, validateSettings } from "./settings";
import type {
  Alert,
  Metric,
  Mode,
  ScenarioId,
  Settings,
  StudioState,
} from "./types";

// This internal discriminated union is the UI/engine command contract. It is not
// an authenticated public protocol or a runtime parser for external commands.
export type Action =
  | { type: "tick" }
  | { type: "start" | "pause" | "reset" }
  | { type: "scenario"; scenario: ScenarioId }
  | { type: "mode"; mode: Mode }
  | { type: "target"; metric: "rpm" | "engineLoad"; value: number }
  | { type: "transport"; enabled: boolean }
  | { type: "ack"; key: Alert["key"] }
  | { type: "settings"; settings: Settings };
/**
 * Build fresh diagnostics/history around a validated initial sample. Manual
 * sessions wait in standby; guided scenarios start immediately. Preferences
 * are revalidated and preserved by replay/reset, while session evidence resets.
 */
export function createStudio(
  settings = structuredClone(defaultSettings),
  scenario: ScenarioId = "manual",
): StudioState {
  const simulation = createSimulation(scenario);
  return {
    running: scenario !== "manual",
    hasStarted: scenario !== "manual",
    simulation,
    settings: validateSettings(settings),
    history: [simulation.received],
    diagnostics: addEvent(
      createDiagnostics(),
      0,
      scenario === "manual"
        ? "Session ready. Start the simulator or replay a guided scenario."
        : `Guided scenario started: ${scenario}. Fixed seed ${simulation.seed}.`,
    ),
  };
}
/** Apply a single deterministic state transition; side effects belong to App. */
export function studioReducer(state: StudioState, action: Action): StudioState {
  switch (action.type) {
    // Advance only while running. History follows accepted measurement changes,
    // so outages/rejections create gaps instead of fabricated fresh samples.
    case "tick": {
      if (!state.running) return state;
      const simulation = advanceSimulation(state.simulation);
      const fresh = simulation.receivedAt !== state.simulation.receivedAt;
      return {
        ...state,
        simulation,
        diagnostics: updateDiagnostics(
          state.diagnostics,
          simulation,
          state.settings,
        ),
        history: fresh
          ? [...state.history, simulation.received].slice(-HISTORY_CAPACITY)
          : state.history,
      };
    }
    // Replay/reset create a new seed-aligned session while retaining validated
    // preferences. Reset returns to manual standby, rather than resuming replay.
    case "scenario":
      return createStudio(state.settings, action.scenario);
    case "reset":
      return createStudio(state.settings);
    // hasStarted wakes the displays once; pausing holds the current readings and
    // freezes simulation time, including the demonstration timeout detector.
    case "start":
      return state.running
        ? state
        : {
            ...state,
            running: true,
            hasStarted: true,
            diagnostics: addEvent(
              state.diagnostics,
              state.simulation.time,
              "Simulation started.",
            ),
          };
    case "pause":
      return !state.running
        ? state
        : {
            ...state,
            running: false,
            diagnostics: addEvent(
              state.diagnostics,
              state.simulation.time,
              "Simulation paused. Simulation time and timeout detection are suspended.",
            ),
          };
    // Direct mode/target/transport edits leave guided replay. Finite target
    // values are clamped to demo command limits before the model sees them.
    case "mode":
      return {
        ...state,
        simulation: setMode(state.simulation, action.mode),
        diagnostics: addEvent(
          state.diagnostics,
          state.simulation.time,
          `Operating mode changed to ${action.mode}.`,
        ),
      };
    case "target": {
      if (!Number.isFinite(action.value)) return state;
      const value =
        action.metric === "rpm"
          ? clamp(action.value, 600, 3400)
          : clamp(action.value, 0, 100);
      return {
        ...state,
        simulation: {
          ...state.simulation,
          scenario: "manual",
          [action.metric === "rpm" ? "rpmTarget" : "loadTarget"]: value,
        },
      };
    }
    case "transport":
      return {
        ...state,
        simulation: {
          ...state.simulation,
          scenario: "manual",
          transportEnabled: action.enabled,
        },
        diagnostics: addEvent(
          state.diagnostics,
          state.simulation.time,
          action.enabled
            ? "Sample transport enabled."
            : "Sample transport interrupted.",
        ),
      };
    // Acknowledgment records review only. Settings changes are validated before
    // use; neither operation grants hardware authority or persists events.
    case "ack":
      return {
        ...state,
        diagnostics: acknowledge(
          state.diagnostics,
          action.key,
          state.simulation.time,
        ),
      };
    case "settings":
      return {
        ...state,
        settings: validateSettings(action.settings),
        diagnostics: addEvent(
          state.diagnostics,
          state.simulation.time,
          "Settings updated. Thresholds use canonical psi and °F units.",
        ),
      };
  }
}
/**
 * Export only retained accepted samples in stable canonical-unit columns.
 * Seed/scenario describe the current session; missing/rejected deliveries do
 * not become rows. Download creation and object-URL cleanup live in EvidencePanel.
 */
export function exportTelemetry(state: StudioState): string {
  const header =
    "disclaimer,seed,scenario,simulation_seconds,rpm,oil_psi,coolant_f,battery_v,fuel_percent,load_percent";
  return [
    header,
    ...state.history.map((s) =>
      [
        "SIMULATED - NOT LIVE EQUIPMENT",
        state.simulation.seed,
        state.simulation.scenario,
        s.time.toFixed(1),
        ...(
          [
            "rpm",
            "oilPressure",
            "coolantTemp",
            "batteryVoltage",
            "fuelLevel",
            "engineLoad",
          ] as Metric[]
        ).map((k) => s[k].toFixed(3)),
      ].join(","),
    ),
  ].join("\r\n");
}
// Quote commas, embedded quotes, and line breaks in application-generated event
// messages. Adding external/user text later would require a separate review of
// spreadsheet formula injection; CSV quoting alone is not that protection.
const csvCell = (value: string) => `"${value.replaceAll('"', '""')}"`;
/** Export the bounded event log with simulation time, severity, and event kind. */
export function exportEvents(state: StudioState): string {
  return [
    "disclaimer,simulation_seconds,severity,event_kind,message",
    ...state.diagnostics.events.map((e) =>
      [
        "SIMULATED - NOT LIVE EQUIPMENT",
        e.time.toFixed(1),
        e.severity,
        e.kind,
        csvCell(e.message),
      ].join(","),
    ),
  ].join("\r\n");
}
