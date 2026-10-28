/**
 * Default display/alarm preferences and the browser-settings validation boundary.
 * App reads these preferences at startup and persists validated settings when
 * they change; studio-state.ts revalidates settings before using them in state.
 * Each field falls back independently so corrupt storage does not spoil a demo.
 *
 * Thresholds illustrate HMI alarm configuration in canonical psi and degrees
 * Fahrenheit. They are demonstration choices, not calibrated equipment limits.
 * Browser storage provides neither operator authorization nor an approved,
 * durable configuration history; production changes would need those controls.
 */
import { METRICS, type Settings, type Threshold } from "./types";

// Keep this key stable across deployments: changing it would reset returning
// visitors' saved preferences rather than merely reorganizing the repository.
export const SETTINGS_KEY = "cobalt-studio-settings-v1";
// Each process channel chooses an above/below direction, a critical boundary,
// and a smaller recovery margin. Fresh accepted samples drive their debounce.
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
// Editor limits constrain this demonstration's configurable thresholds. These
// differ intentionally from drawing scales and telemetry acceptance bounds.
const bounds = {
  rpm: [600, 3600],
  oilPressure: [0, 100],
  coolantTemp: [100, 280],
  batteryVoltage: [10, 16],
  fuelLevel: [0, 100],
  engineLoad: [0, 100],
} as const;
/**
 * Require finite, ordered thresholds with a fixed per-signal direction and a
 * positive recovery margin smaller than the warning/critical gap. Returning a
 * message instead of mutating the rule lets the editor keep invalid drafts.
 */
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
/**
 * Start with an owned default object, then copy only independently valid fields.
 * Parsed JSON is not trusted just because it came from same-origin storage.
 * This is configuration validation, not authentication of a settings author.
 */
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
// A small storage port keeps the engine independent of window and allows tests
// to model blocked storage or malformed JSON without launching a browser.
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
/** Recover with fresh defaults if storage access or JSON parsing fails. */
export function readSettings(storage: StorageLike): Settings {
  try {
    return validateSettings(
      JSON.parse(storage.getItem(SETTINGS_KEY) || "null"),
    );
  } catch {
    return structuredClone(defaultSettings);
  }
}
// Return persistence status to App so the HMI can say session-only when storage
// is blocked. Success means the browser accepted the write, not durable storage.
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
