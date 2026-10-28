/**
 * Presentation contract for the device workspace's six editable instrument slots.
 * DeviceWorkspace owns this session-only layout; this module supplies pure
 * defaults, validation, immutable updates, and drawing helpers. instruments.ts
 * defines the known signals and canonical display ranges used by these checks.
 *
 * An HMI often binds a signal to a display separately from process configuration.
 * This demo illustrates that separation: changing a label, binding, or scale
 * cannot alter telemetry, transport, or diagnostic thresholds. It does not save
 * a device configuration, provision hardware, or write to an industrial bus.
 */
import { metricInfo } from "./instruments";
import { METRICS, type Metric } from "./types";

// A presentation-only contract. These properties never change telemetry or alerts.
export const DEVICE_LAYOUT_VERSION = 1 as const;
export const DEVICE_SLOT_IDS = [1, 2, 3, 4, 5, 6] as const;
export type DeviceSlotId = (typeof DEVICE_SLOT_IDS)[number];
// Slot IDs are stable presentation positions. Multiple slots may show the same
// metric; unique slot identity, rather than unique signal binding, is required.
export interface DeviceProperties {
  metric: Metric;
  label: string;
  min: number;
  max: number;
}
export interface DeviceSlot extends DeviceProperties {
  id: DeviceSlotId;
}
export interface DeviceLayout {
  version: typeof DEVICE_LAYOUT_VERSION;
  slots: DeviceSlot[];
}
export type DeviceField =
  "metric" | "label" | "min" | "max" | "range" | "layout";
// Discriminated results let the form associate an error with the correct field
// while leaving the previously applied layout intact until validation succeeds.
export type DeviceValidation =
  | { ok: true; properties: DeviceProperties }
  | { ok: false; field: DeviceField; error: string };
export type DeviceUpdate =
  | { ok: true; layout: DeviceLayout }
  | { ok: false; field: DeviceField; error: string };

/** Copy catalog defaults so editing a slot cannot mutate the shared catalog. */
export function defaultDeviceProperties(metric: Metric): DeviceProperties {
  const info = metricInfo[metric];
  return { metric, label: info.label, min: info.min, max: info.max };
}

/** Start six independent slots, in the same signal order used by the dashboard. */
export function createDefaultDeviceLayout(): DeviceLayout {
  return {
    version: DEVICE_LAYOUT_VERSION,
    slots: DEVICE_SLOT_IDS.map((id, index) => ({
      id,
      ...defaultDeviceProperties(METRICS[index]),
    })),
  };
}

/**
 * Validate draft display properties and return an owned, trimmed whitelist copy.
 * Bounds use canonical units even when the view displays converted units. Label
 * checks improve readable HMI presentation; React still owns text escaping.
 */
export function validateDeviceProperties(value: unknown): DeviceValidation {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return {
      ok: false,
      field: "layout",
      error: "Enter valid display properties.",
    };
  const raw = value as Record<string, unknown>;
  if (!METRICS.includes(raw.metric as Metric))
    return {
      ok: false,
      field: "metric",
      error: "Choose one of the six available signals.",
    };
  if (
    typeof raw.label !== "string" ||
    !raw.label.trim() ||
    raw.label.trim().length > 32
  )
    return {
      ok: false,
      field: "label",
      error: "Use a display label of 1–32 characters.",
    };
  if (/[\u0000-\u001f\u007f]/.test(raw.label))
    return {
      ok: false,
      field: "label",
      error: "The display label cannot contain control characters.",
    };
  if (typeof raw.min !== "number" || !Number.isFinite(raw.min))
    return {
      ok: false,
      field: "min",
      error: "Enter a finite numeric scale minimum.",
    };
  if (typeof raw.max !== "number" || !Number.isFinite(raw.max))
    return {
      ok: false,
      field: "max",
      error: "Enter a finite numeric scale maximum.",
    };
  if (raw.min >= raw.max)
    return {
      ok: false,
      field: "range",
      error: "The scale maximum must be greater than the minimum.",
    };
  const metric = raw.metric as Metric;
  const info = metricInfo[metric];
  if (raw.min < info.min || raw.max > info.max)
    return {
      ok: false,
      field: "range",
      error: `Keep the scale within ${info.min}–${info.max} ${info.unit}.`,
    };
  return {
    ok: true,
    properties: { metric, label: raw.label.trim(), min: raw.min, max: raw.max },
  };
}

/**
 * Reject unsupported versions and missing/duplicate slots before replacing one
 * slot. Other slots retain their applied values; the caller owns form drafts.
 * This version check is a layout contract, not a persistent migration system.
 */
export function applyDeviceProperties(
  layout: DeviceLayout,
  slotId: DeviceSlotId,
  value: unknown,
): DeviceUpdate {
  if (
    layout.version !== DEVICE_LAYOUT_VERSION ||
    layout.slots.length !== 6 ||
    !DEVICE_SLOT_IDS.every(
      (id) => layout.slots.filter((slot) => slot.id === id).length === 1,
    ) ||
    !layout.slots.some((slot) => slot.id === slotId)
  )
    return {
      ok: false,
      field: "layout",
      error: "The device layout requires six unique slots and version 1.",
    };
  const validation = validateDeviceProperties(value);
  if (!validation.ok) return validation;
  return {
    ok: true,
    layout: {
      version: DEVICE_LAYOUT_VERSION,
      slots: layout.slots.map((slot) =>
        slot.id === slotId ? { id: slot.id, ...validation.properties } : slot,
      ),
    },
  };
}

// Reset means the selected position's original signal and catalog scale. It is
// independent of Reset session in studio-state.ts, which resets model evidence.
export function resetDeviceSlot(
  layout: DeviceLayout,
  slotId: DeviceSlotId,
): DeviceUpdate {
  if (!DEVICE_SLOT_IDS.includes(slotId))
    return {
      ok: false,
      field: "layout",
      error: "Choose an available device slot.",
    };
  return applyDeviceProperties(
    layout,
    slotId,
    defaultDeviceProperties(METRICS[slotId - 1]),
  );
}

/** Map a validated scale to a safe drawing fraction without changing the sample. */
export function deviceScalePosition(
  value: number,
  properties: DeviceProperties,
): number {
  // Clamp only the drawn needle, never the numeric reading or the accepted sample.
  if (!Number.isFinite(value)) return 0;
  return Math.max(
    0,
    Math.min(1, (value - properties.min) / (properties.max - properties.min)),
  );
}

// Describe off-scale readings explicitly: a clipped needle alone could conceal
// the fact that a valid accepted value lies beyond a customized display range.
export function deviceRangeDescription(
  value: number,
  properties: DeviceProperties,
): string {
  if (value < properties.min) return "Below display scale";
  if (value > properties.max) return "Above display scale";
  return "Within display scale";
}
