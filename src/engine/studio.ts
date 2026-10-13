import {
  acknowledge,
  addEvent,
  createDiagnostics,
  updateDiagnostics,
} from "./diagnostics";
import { HISTORY_CAPACITY } from "./model";
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

export type Action =
  | { type: "tick" }
  | { type: "start" | "pause" | "reset" }
  | { type: "scenario"; scenario: ScenarioId }
  | { type: "mode"; mode: Mode }
  | { type: "target"; metric: "rpm" | "engineLoad"; value: number }
  | { type: "transport"; enabled: boolean }
  | { type: "ack"; key: Alert["key"] }
  | { type: "settings"; settings: Settings };
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
export function studioReducer(state: StudioState, action: Action): StudioState {
  switch (action.type) {
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
    case "scenario":
      return createStudio(state.settings, action.scenario);
    case "reset":
      return createStudio(state.settings);
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
const csvCell = (value: string) => `"${value.replaceAll('"', '""')}"`;
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
