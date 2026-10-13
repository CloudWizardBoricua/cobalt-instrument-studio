import { metricInfo } from "./model";
import { METRICS, type Metric } from "./types";

// A presentation-only contract. These properties never change telemetry or alerts.
export const DEVICE_LAYOUT_VERSION = 1 as const;
export const DEVICE_SLOT_IDS = [1, 2, 3, 4, 5, 6] as const;
export type DeviceSlotId = (typeof DEVICE_SLOT_IDS)[number];
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
export type DeviceValidation =
  | { ok: true; properties: DeviceProperties }
  | { ok: false; field: DeviceField; error: string };
export type DeviceUpdate =
  | { ok: true; layout: DeviceLayout }
  | { ok: false; field: DeviceField; error: string };

export function defaultDeviceProperties(metric: Metric): DeviceProperties {
  const info = metricInfo[metric];
  return { metric, label: info.label, min: info.min, max: info.max };
}

export function createDefaultDeviceLayout(): DeviceLayout {
  return {
    version: DEVICE_LAYOUT_VERSION,
    slots: DEVICE_SLOT_IDS.map((id, index) => ({
      id,
      ...defaultDeviceProperties(METRICS[index]),
    })),
  };
}

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

export function deviceRangeDescription(
  value: number,
  properties: DeviceProperties,
): string {
  if (value < properties.min) return "Below display scale";
  if (value > properties.max) return "Above display scale";
  return "Within display scale";
}
