/**
 * Protect the presentation-only six-slot device layout and its validation boundary.
 * Fixtures bind canonical telemetry channels to labels and drawing ranges; edits must
 * commit atomically and leave both the input layout and physical simulation untouched.
 * Gauge clipping is a display concern, not a change to alarm thresholds or sensor data.
 */
import { describe, expect, it } from "vitest";
import {
  applyDeviceProperties,
  createDefaultDeviceLayout,
  DEVICE_LAYOUT_VERSION,
  deviceRangeDescription,
  deviceScalePosition,
  resetDeviceSlot,
  validateDeviceProperties,
  type DeviceLayout,
  type DeviceProperties,
} from "../src/engine/device-layout";
import { displayValue } from "../src/engine/instruments";
import { METRICS } from "../src/engine/types";

// Canonical psi range: display-unit conversion occurs after this presentation model.
const oilScale: DeviceProperties = {
  metric: "oilPressure",
  label: "Lubrication",
  min: 10,
  max: 80,
};
// Invalid edits must leave all six slots intact; valid edits affect only their target slot.
describe("presentation-only device layout", () => {
  it("starts with six unique slots bound to every accepted channel", () => {
    const layout = createDefaultDeviceLayout();
    expect(layout.version).toBe(DEVICE_LAYOUT_VERSION);
    expect(layout.slots.map((slot) => slot.id)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(layout.slots.map((slot) => slot.metric)).toEqual(METRICS);
    for (const slot of layout.slots)
      expect(validateDeviceProperties(slot).ok).toBe(true);
  });
  it("commits a valid binding, label and scale together while preserving other slots", () => {
    const layout = createDefaultDeviceLayout();
    const before = structuredClone(layout);
    const result = applyDeviceProperties(layout, 1, {
      ...oilScale,
      label: "  Lubrication  ",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error);
    expect(result.layout.slots[0]).toEqual({ id: 1, ...oilScale });
    expect(result.layout.slots.slice(1)).toEqual(layout.slots.slice(1));
    expect(layout).toEqual(before);
  });
  it("rejects non-numeric and non-finite scale values without partially applying a binding", () => {
    const layout = createDefaultDeviceLayout();
    const before = structuredClone(layout);
    for (const value of [NaN, Infinity, -Infinity, "10", null]) {
      for (const field of ["min", "max"] as const) {
        const result = applyDeviceProperties(layout, 1, {
          ...oilScale,
          [field]: value,
        });
        expect(result.ok).toBe(false);
        if (result.ok) throw new Error("Invalid properties were accepted");
        expect(result.field).toBe(field);
        expect(layout).toEqual(before);
      }
    }
  });
  it("rejects inverted, zero-span and unsupported scales, while accepting the display-domain edges", () => {
    for (const patch of [
      { min: 80, max: 10 },
      { min: 10, max: 10 },
      { min: -1 },
      { max: 101 },
    ])
      expect(validateDeviceProperties({ ...oilScale, ...patch }).ok).toBe(
        false,
      );
    expect(validateDeviceProperties({ ...oilScale, min: 0, max: 100 }).ok).toBe(
      true,
    );
    expect(
      validateDeviceProperties({
        metric: "coolantTemp",
        label: "Thermal",
        min: 99,
        max: 260,
      }).ok,
    ).toBe(false);
    expect(
      validateDeviceProperties({
        metric: "batteryVoltage",
        label: "Supply",
        min: 10,
        max: 16,
      }).ok,
    ).toBe(true);
  });
  it("limits binding choices and rejects blank, oversized or control-character labels", () => {
    expect(
      validateDeviceProperties({ ...oilScale, metric: "unknown" }).ok,
    ).toBe(false);
    for (const label of [
      "",
      " ",
      "x".repeat(33),
      "Line\nbreak",
      "NUL\u0000label",
      42,
    ])
      expect(validateDeviceProperties({ ...oilScale, label }).ok).toBe(false);
    expect(
      validateDeviceProperties({ ...oilScale, label: "x".repeat(32) }).ok,
    ).toBe(true);
    expect(validateDeviceProperties(null).ok).toBe(false);
    expect(validateDeviceProperties([]).ok).toBe(false);
  });
  it("restores only the selected slot after multiple independent display edits", () => {
    const initial = createDefaultDeviceLayout();
    const first = applyDeviceProperties(initial, 1, oilScale);
    if (!first.ok) throw new Error(first.error);
    const second = applyDeviceProperties(first.layout, 2, {
      metric: "rpm",
      label: "Drive speed",
      min: 600,
      max: 2800,
    });
    if (!second.ok) throw new Error(second.error);
    const reset = resetDeviceSlot(second.layout, 1);
    expect(reset.ok).toBe(true);
    if (!reset.ok) throw new Error(reset.error);
    expect(reset.layout.slots[0]).toEqual(initial.slots[0]);
    expect(reset.layout.slots[1]).toEqual(second.layout.slots[1]);
    expect(second.layout.slots[0].metric).toBe("oilPressure");
  });
  it("keeps the numeric value and canonical scale intact when clipping the drawn needle", () => {
    const sample = { oilPressure: 5 };
    expect(deviceScalePosition(sample.oilPressure, oilScale)).toBe(0);
    expect(deviceRangeDescription(sample.oilPressure, oilScale)).toBe(
      "Below display scale",
    );
    expect(deviceScalePosition(90, oilScale)).toBe(1);
    expect(deviceRangeDescription(90, oilScale)).toBe("Above display scale");
    expect(deviceScalePosition(45, oilScale)).toBe(0.5);
    expect(deviceRangeDescription(10, oilScale)).toBe("Within display scale");
    expect(
      displayValue("oilPressure", sample.oilPressure, "metric"),
    ).toBeCloseTo(34.473785);
    expect(sample.oilPressure).toBe(5);
    expect(oilScale).toEqual({
      metric: "oilPressure",
      label: "Lubrication",
      min: 10,
      max: 80,
    });
  });
  it("refuses unsupported versions or missing/duplicate slots before applying properties", () => {
    const initial = createDefaultDeviceLayout();
    const wrongVersion = { ...initial, version: 2 } as unknown as DeviceLayout;
    const missing = { ...initial, slots: initial.slots.slice(1) };
    const duplicate = {
      ...initial,
      slots: initial.slots.map((slot) => ({ ...slot, id: 1 as const })),
    };
    for (const layout of [wrongVersion, missing, duplicate])
      expect(applyDeviceProperties(layout, 1, oilScale).ok).toBe(false);
  });
});
