import type { Metric, Mode, ScenarioId } from "./types";

export const UPDATE_MS = 500;
export const HISTORY_CAPACITY = 240;
export const EVENT_CAPACITY = 100;
export const DEFAULT_SEED = 27041;
export const DISCLAIMER = "SIMULATED — NOT LIVE EQUIPMENT";
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
export const MODE_TARGETS: Record<Mode, { rpm: number; load: number }> = {
  Idle: { rpm: 800, load: 12 },
  Normal: { rpm: 1650, load: 48 },
  "High Load": { rpm: 2550, load: 84 },
  Fault: { rpm: 2750, load: 94 },
};
export const scenarios: {
  id: Exclude<ScenarioId, "manual">;
  number: string;
  title: string;
  description: string;
  duration: number;
  expected: string;
}[] = [
  {
    id: "normal-ramp",
    number: "01",
    title: "Normal operating ramp",
    description: "Watch speed, load, and oil pressure settle together.",
    duration: 35,
    expected:
      "Ramps from idle to normal operation. Temperature follows slowly; diagnostics remain normal at default thresholds.",
  },
  {
    id: "overheat",
    number: "02",
    title: "Coolant overheat",
    description: "Follow a thermal fault from warning to critical.",
    duration: 35,
    expected:
      "Cooling degradation begins at 6 s. Coolant crosses 220 °F warning and 235 °F critical thresholds. Acknowledge the alert, then reset to resolve.",
  },
  {
    id: "communication-loss",
    number: "03",
    title: "Communication loss",
    description: "See stale readings, a timeout, and recovery.",
    duration: 25,
    expected:
      "Samples stop at 5 s. A 2 s timeout marks readings stale. Delivery resumes at 17 s, resolving the communication alert.",
  },
];
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
export function displayUnit(metric: Metric, units: "metric" | "imperial") {
  if (units === "metric" && metric === "oilPressure") return "kPa";
  if (units === "metric" && metric === "coolantTemp") return "°C";
  return metricInfo[metric].unit;
}
export function formatValue(
  metric: Metric,
  value: number,
  units: "metric" | "imperial",
) {
  return displayValue(metric, value, units).toFixed(
    metric === "batteryVoltage" || metric === "fuelLevel" ? 1 : 0,
  );
}
export function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
}
