/**
 * Shared vocabulary for the simulator, its HMI views, and the automated tests.
 * Keeping signal names and state shapes here lets every instrument consume the
 * same accepted sample rather than inventing its own model or alarm state.
 *
 * These TypeScript contracts describe internal data at compile time. Runtime
 * checks live in telemetry.ts, settings.ts, and device-layout.ts. They neither
 * define a hardware protocol nor authenticate a field device. A future adapter
 * would need explicit protocol mapping, quality metadata, and trust controls.
 */

// Signal identity is stable across the model, display bindings, thresholds, and
// CSV column selection. Units remain canonical in state; only views convert them.
export const METRICS = [
  "rpm",
  "oilPressure",
  "coolantTemp",
  "batteryVoltage",
  "fuelLevel",
  "engineLoad",
] as const;
export type Metric = (typeof METRICS)[number];
// Modes change model targets; scenarios script a repeatable demonstration.
export type Mode = "Idle" | "Normal" | "High Load" | "Fault";
export type ScenarioId =
  | "manual"
  | "normal-ramp"
  | "overheat"
  | "communication-loss"
  | "oil-pressure-loss"
  | "invalid-sample-delivery";
export type Severity = "normal" | "warning" | "critical";
// time is simulation seconds, not a wall-clock timestamp. The versioned envelope
// belongs at the acceptance boundary; instruments receive the accepted values.
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
// Delivery quality is separate from process severity: a rejected sample can
// leave a healthy process reading visible while its measurement age grows.
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
// Alarm thresholds use canonical psi and degrees Fahrenheit even when the HMI
// displays kPa or degrees Celsius. Hysteresis is the recovery margin; debounce
// counts distinct accepted samples before changing a process alert's severity.
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
/**
 * Separate generated process truth (values) from the last accepted measurement
 * (received). Outage and invalid-delivery scenarios keep values advancing while
 * received stays frozen. receivedAt deliberately tracks measurement time.
 */
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
// candidate/candidateSamples support debounce without changing the active alert
// immediately. Acknowledgment records review; it never clears the condition.
export interface Alert {
  key: Metric | "communication";
  severity: Severity;
  since: number;
  acknowledged: boolean;
  reason: string;
  candidate: Severity;
  candidateSamples: number;
}
// Events explain simulator actions and transitions. They are bounded in-memory
// demonstration evidence, with no durable or tamper-evident industrial audit log.
export interface EventRecord {
  id: number;
  time: number;
  severity: Severity;
  kind:
    "transition" | "acknowledgment" | "operator" | "validation" | "recovery";
  message: string;
}
// Processing timestamps keep the same accepted sample or delivery notice from
// being counted repeatedly when the reducer advances without a fresh reading.
export interface Diagnostics {
  alerts: Record<Metric | "communication", Alert>;
  events: EventRecord[];
  nextId: number;
  lastProcessedSampleTimestamp: number | null;
  lastDeliveryAttemptAt: number | null;
}
// One reducer owns session state. hasStarted distinguishes initial standby from
// a paused session; the prepared time-zero sample exists in both situations.
export interface StudioState {
  running: boolean;
  hasStarted: boolean;
  simulation: Simulation;
  diagnostics: Diagnostics;
  history: Telemetry[];
  settings: Settings;
}
