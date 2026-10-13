import { METRICS, type Settings, type Threshold } from "./types";
export const SETTINGS_KEY = "cobalt-studio-settings-v1";
export const defaultSettings: Settings = {
  theme: "night",
  units: "imperial",
  debounceSamples: 2,
  timeoutSeconds: 2,
  visible: {
    rpm: true,
    oilPressure: true,
    coolantTemp: true,
    batteryVoltage: true,
    fuelLevel: true,
    engineLoad: true,
  },
  thresholds: {
    rpm: { warning: 2900, critical: 3300, hysteresis: 80, direction: "above" },
    oilPressure: {
      warning: 24,
      critical: 16,
      hysteresis: 3,
      direction: "below",
    },
    coolantTemp: {
      warning: 220,
      critical: 235,
      hysteresis: 4,
      direction: "above",
    },
    batteryVoltage: {
      warning: 12.3,
      critical: 11.7,
      hysteresis: 0.2,
      direction: "below",
    },
    fuelLevel: { warning: 20, critical: 10, hysteresis: 2, direction: "below" },
    engineLoad: {
      warning: 90,
      critical: 98,
      hysteresis: 3,
      direction: "above",
    },
  },
};
const bounds = {
  rpm: [600, 3600],
  oilPressure: [0, 100],
  coolantTemp: [100, 280],
  batteryVoltage: [10, 16],
  fuelLevel: [0, 100],
  engineLoad: [0, 100],
} as const;
export function validateThreshold(
  metric: (typeof METRICS)[number],
  rule: Threshold,
): string | null {
  if (![rule.warning, rule.critical, rule.hysteresis].every(Number.isFinite))
    return "Enter finite numeric values.";
  const [low, high] = bounds[metric];
  if (
    rule.warning < low ||
    rule.warning > high ||
    rule.critical < low ||
    rule.critical > high
  )
    return `Thresholds must be between ${low} and ${high}.`;
  if (rule.direction !== defaultSettings.thresholds[metric].direction)
    return "The threshold direction cannot be changed.";
  if (
    rule.direction === "above"
      ? rule.warning >= rule.critical
      : rule.warning <= rule.critical
  )
    return "The critical threshold must be beyond the warning threshold.";
  if (
    rule.hysteresis <= 0 ||
    rule.hysteresis >= Math.abs(rule.warning - rule.critical)
  )
    return "Hysteresis must be positive and smaller than the threshold gap.";
  return null;
}
export function validateSettings(value: unknown): Settings {
  const output: Settings = structuredClone(defaultSettings);
  if (!value || typeof value !== "object") return output;
  const raw = value as Partial<Settings>;
  if (raw.theme === "night" || raw.theme === "day") output.theme = raw.theme;
  if (raw.units === "metric" || raw.units === "imperial")
    output.units = raw.units;
  if (
    Number.isInteger(raw.debounceSamples) &&
    raw.debounceSamples! >= 1 &&
    raw.debounceSamples! <= 10
  )
    output.debounceSamples = raw.debounceSamples!;
  if (
    Number.isInteger(raw.timeoutSeconds) &&
    raw.timeoutSeconds! >= 1 &&
    raw.timeoutSeconds! <= 10
  )
    output.timeoutSeconds = raw.timeoutSeconds!;
  for (const metric of METRICS) {
    if (typeof raw.visible?.[metric] === "boolean")
      output.visible[metric] = raw.visible[metric];
    const rule = raw.thresholds?.[metric];
    if (rule && !validateThreshold(metric, rule))
      output.thresholds[metric] = { ...rule };
  }
  return output;
}
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export function readSettings(storage: StorageLike): Settings {
  try {
    return validateSettings(
      JSON.parse(storage.getItem(SETTINGS_KEY) || "null"),
    );
  } catch {
    return structuredClone(defaultSettings);
  }
}
export function writeSettings(
  storage: StorageLike,
  settings: Settings,
): boolean {
  try {
    storage.setItem(SETTINGS_KEY, JSON.stringify(validateSettings(settings)));
    return true;
  } catch {
    return false;
  }
}
