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
  | "manual"
  | "normal-ramp"
  | "overheat"
  | "communication-loss"
  | "oil-pressure-loss"
  | "invalid-sample-delivery";
export type Severity = "normal" | "warning" | "critical";
export type Telemetry = Record<Metric, number> & { time: number };
export type TelemetryEnvelope = Telemetry & { contractVersion: 1 };
export type SampleIssueCode =
  | "malformed"
  | "contract-version"
  | "missing-field"
  | "numeric-type"
  | "non-finite"
  | "out-of-bounds"
  | "timestamp-bounds"
  | "future-timestamp"
  | "duplicate-timestamp"
  | "out-of-order-timestamp";
export interface SampleIssue {
  code: SampleIssueCode;
  field: Metric | "time" | "contractVersion" | "sample";
  message: string;
}
export interface DeliveryNotice {
  kind: "validation" | "recovery";
  message: string;
}
export interface SampleDelivery {
  contractVersion: 1;
  status: "accepted" | "rejected" | "recovered";
  acceptedCount: number;
  rejectedCount: number;
  consecutiveRejected: number;
  lastAttemptAt: number;
  lastRejectedAt: number | null;
  lastRecoveryAt: number | null;
  issues: SampleIssue[];
  episodeCodes: SampleIssueCode[];
  notices: DeliveryNotice[];
}
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
  delivery: SampleDelivery;
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
  kind:
    "transition" | "acknowledgment" | "operator" | "validation" | "recovery";
  message: string;
}
export interface Diagnostics {
  alerts: Record<Metric | "communication", Alert>;
  events: EventRecord[];
  nextId: number;
  lastProcessedSampleTimestamp: number | null;
  lastDeliveryAttemptAt: number | null;
}
export interface StudioState {
  running: boolean;
  simulation: Simulation;
  diagnostics: Diagnostics;
  history: Telemetry[];
  settings: Settings;
}
