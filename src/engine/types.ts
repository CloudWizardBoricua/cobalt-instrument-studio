export const METRICS = [
  "rpm",
  "oilPressure",
  "coolantTemp",
  "batteryVoltage",
  "fuelLevel",
  "engineLoad",
] as const;
export type Metric = (typeof METRICS)[number];
export type Mode = "Idle" | "Normal" | "High Load" | "Fault";
export type ScenarioId =
  "manual" | "normal-ramp" | "overheat" | "communication-loss";
export type Severity = "normal" | "warning" | "critical";
export type Telemetry = Record<Metric, number> & { time: number };
export interface Threshold {
  warning: number;
  critical: number;
  hysteresis: number;
  direction: "above" | "below";
}
export type Thresholds = Record<Metric, Threshold>;
export interface Settings {
  theme: "night" | "day";
  units: "imperial" | "metric";
  visible: Record<Metric, boolean>;
  thresholds: Thresholds;
  debounceSamples: number;
  timeoutSeconds: number;
}
export interface Simulation {
  time: number;
  seed: number;
  randomState: number;
  mode: Mode;
  scenario: ScenarioId;
  rpmTarget: number;
  loadTarget: number;
  transportEnabled: boolean;
  receivedAt: number;
  values: Telemetry;
  received: Telemetry;
}
export interface Alert {
  key: Metric | "communication";
  severity: Severity;
  since: number;
  acknowledged: boolean;
  reason: string;
  candidate: Severity;
  candidateSamples: number;
}
export interface EventRecord {
  id: number;
  time: number;
  severity: Severity;
  kind: "transition" | "acknowledgment" | "operator";
  message: string;
}
export interface Diagnostics {
  alerts: Record<Metric | "communication", Alert>;
  events: EventRecord[];
  nextId: number;
}
export interface StudioState {
  running: boolean;
  simulation: Simulation;
  diagnostics: Diagnostics;
  history: Telemetry[];
  settings: Settings;
}
