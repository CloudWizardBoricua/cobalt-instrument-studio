/**
 * Instrument catalog, demonstration timing, scenario narration, and formatting.
 * The simulator and React views share these definitions so a presenter can trace
 * an on-screen signal, unit, and guided fault back to one readable catalog.
 *
 * Display scales, model targets, diagnostic thresholds (settings.ts), and sample
 * plausibility limits (telemetry.ts) serve different purposes. None is a
 * manufacturer-approved operating limit. Production use would require an
 * equipment-specific signal dictionary, calibration, and reviewed alarm rules.
 */
import type { Metric, Mode, ScenarioId } from "./types";

// Fixed model step and bounded in-memory evidence. The seed makes replays
// repeatable; browser scheduling does not provide a real-time control guarantee.
export const UPDATE_MS = 500;
export const HISTORY_CAPACITY = 240;
export const EVENT_CAPACITY = 100;
export const DEFAULT_SEED = 27041;
export const DISCLAIMER = "SIMULATED — NOT LIVE EQUIPMENT";
// Labels, canonical units, colors, and drawing ranges used by gauges and device
// layouts. Clipping a drawn scale must never change the accepted numeric value.
export const metricInfo: Record<
  Metric,
  {
    label: string;
    short: string;
    unit: string;
    min: number;
    max: number;
    color: string;
  }
> = {
  rpm: {
    label: "Engine speed",
    short: "RPM",
    unit: "rpm",
    min: 0,
    max: 3600,
    color: "#2684FF",
  },
  oilPressure: {
    label: "Oil pressure",
    short: "Oil pressure",
    unit: "psi",
    min: 0,
    max: 100,
    color: "#46C7F2",
  },
  coolantTemp: {
    label: "Coolant temperature",
    short: "Coolant",
    unit: "°F",
    min: 100,
    max: 280,
    color: "#62A8FF",
  },
  batteryVoltage: {
    label: "Battery voltage",
    short: "Battery",
    unit: "V",
    min: 10,
    max: 16,
    color: "#92B4FF",
  },
  fuelLevel: {
    label: "Fuel level",
    short: "Fuel",
    unit: "%",
    min: 0,
    max: 100,
    color: "#64DDB5",
  },
  engineLoad: {
    label: "Engine load",
    short: "Load",
    unit: "%",
    min: 0,
    max: 100,
    color: "#BAA2FF",
  },
};
// Manual mode presets drive the same central model as the guided sequences.
// Selecting a mode exits replay; these are simulator commands, not actuator I/O.
export const MODE_TARGETS: Record<Mode, { rpm: number; load: number }> = {
  Idle: { rpm: 800, load: 12 },
  Normal: { rpm: 1650, load: 48 },
  "High Load": { rpm: 2550, load: 84 },
  Fault: { rpm: 2750, load: 94 },
};
// Presenter-facing scripts: simulation.ts implements their time windows while
// diagnostics.ts derives alerts from accepted samples and configured thresholds.
// duration describes the narrated sequence; it does not automatically stop ticks.
export const scenarios: {
  id: Exclude<ScenarioId, "manual">;
  number: string;
  title: string;
  description: string;
  duration: number;
  expected: string;
  faultDomain: "none" | "process" | "delivery";
}[] = [
  {
    id: "normal-ramp",
    number: "01",
    title: "Normal operating ramp",
    description: "Watch speed, load, and oil pressure settle together.",
    duration: 35,
    faultDomain: "none",
    expected:
      "Ramps from idle to normal operation. Temperature follows slowly; diagnostics remain normal at default thresholds.",
  },
  {
    id: "overheat",
    number: "02",
    title: "Coolant overheat",
    description: "Follow a thermal fault from warning to critical.",
    duration: 35,
    faultDomain: "process",
    expected:
      "Cooling degradation begins at 6 s. Coolant crosses 220 °F warning and 235 °F critical thresholds. Acknowledge the alert, then reset to resolve.",
  },
  {
    id: "communication-loss",
    number: "03",
    title: "Communication loss",
    description: "See stale readings, a timeout, and recovery.",
    duration: 25,
    faultDomain: "delivery",
    expected:
      "Samples stop at 5 s. A 2 s timeout marks readings stale. Delivery resumes at 17 s, resolving the communication alert.",
  },
  {
    id: "oil-pressure-loss",
    number: "04",
    title: "Oil pressure loss",
    description: "Follow falling oil pressure through alerts and recovery.",
    duration: 42,
    faultDomain: "process",
    expected:
      "A simulated process fault lowers the oil pressure target at 5 s. Pressure passes 24 psi warning and 16 psi critical thresholds. Acknowledgment records review; escalation requires review again. The normal target returns at 24 s and alerts clear through hysteresis and debounce.",
  },
  {
    id: "invalid-sample-delivery",
    number: "05",
    title: "Invalid sample delivery",
    description: "Reject malformed and misordered samples, then recover.",
    duration: 25,
    faultDomain: "delivery",
    expected:
      "A simulated delivery fault sends non-finite values, missing and incorrectly typed fields, duplicates, and out-of-order timestamps from 5 s. Rejected samples retain valid readings and do not refresh freshness. A 2 s timeout marks readings stale. Valid delivery resumes at 17 s with recovery evidence; the underlying process stays normal.",
  },
];
/** Convert only for presentation; stored samples and alert rules stay canonical. */
export function displayValue(
  metric: Metric,
  value: number,
  units: "metric" | "imperial",
) {
  if (units === "metric" && metric === "oilPressure") return value * 6.894757;
  if (units === "metric" && metric === "coolantTemp")
    return ((value - 32) * 5) / 9;
  return value;
}
/** Pair a converted value with its display unit; unchanged channels keep theirs. */
export function displayUnit(metric: Metric, units: "metric" | "imperial") {
  if (units === "metric" && metric === "oilPressure") return "kPa";
  if (units === "metric" && metric === "coolantTemp") return "°C";
  return metricInfo[metric].unit;
}
// Decimal precision is a readability choice for this demo, not sensor accuracy.
export function formatValue(
  metric: Metric,
  value: number,
  units: "metric" | "imperial",
) {
  return displayValue(metric, value, units).toFixed(
    metric === "batteryVoltage" || metric === "fuelLevel" ? 1 : 0,
  );
}
// Render elapsed simulation time. Minutes can exceed 59; no date/time zone or
// real-world device timestamp is implied by this compact HMI label.
export function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
}
