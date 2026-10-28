/**
 * Verify the simulated acquisition boundary before readings reach diagnostics/views.
 * Owned-envelope fixtures exercise version, numeric bounds and timestamp acceptance;
 * deterministic reducer runs then prove rejection, age, evidence and recovery behavior.
 * Rejected deliveries retain the last accepted sample rather than fabricating zeroes.
 * No network transport, authenticated device or real sensor is involved in this suite.
 */
import { describe, expect, it } from "vitest";
import {
  updateDiagnostics,
  createDiagnostics,
} from "../src/engine/diagnostics";
import {
  EVENT_CAPACITY,
  HISTORY_CAPACITY,
  scenarios,
} from "../src/engine/instruments";
import { defaultSettings } from "../src/engine/settings";
import { advanceSimulation, createSimulation } from "../src/engine/simulation";
import { createStudio, studioReducer } from "../src/engine/studio-state";
import {
  createTelemetryEnvelope,
  deliverTelemetry,
  TELEMETRY_CONTRACT,
  validateTelemetrySample,
} from "../src/engine/telemetry";
import {
  METRICS,
  type SampleIssueCode,
  type StudioState,
} from "../src/engine/types";

// Drive the reducer without wall-clock waits, preserving the production action path.
function ticks(state: StudioState, count: number) {
  for (let index = 0; index < count; index++)
    state = studioReducer(state, { type: "tick" });
  return state;
}
// Valid baseline at time 1; each negative case changes only the field under investigation.
const envelope = () =>
  createTelemetryEnvelope({ ...createSimulation().values, time: 1 });
const context = { simulationTime: 1, lastAcceptedTimestamp: 0 };
const rejection = (candidate: unknown, code: SampleIssueCode) => {
  const result = validateTelemetrySample(candidate, context);
  expect(result.ok).toBe(false);
  expect(result.issues.some((issue) => issue.code === code)).toBe(true);
};

// Input contract tests distinguish malformed deliveries from valid process alarm values.
describe("versioned telemetry acceptance contract", () => {
  it("validates each session's time-zero readings before accepting later samples", () => {
    for (const scenario of [
      "manual",
      ...scenarios.map((item) => item.id),
    ] as const) {
      const initial = createSimulation(scenario);
      expect(
        validateTelemetrySample(createTelemetryEnvelope(initial.received), {
          simulationTime: 0,
        }).ok,
      ).toBe(true);
      expect(initial.received.time).toBe(0);
      expect(initial.receivedAt).toBe(0);
      expect(initial.received).not.toBe(initial.values);
      expect(initial.delivery.acceptedCount).toBe(1);
      expect(initial.delivery.rejectedCount).toBe(0);
      const next = advanceSimulation(initial);
      expect(next.received.time).toBe(0.5);
      expect(next.delivery.acceptedCount).toBe(2);
      const duplicate = deliverTelemetry(
        next,
        createTelemetryEnvelope(initial.received),
      );
      expect(duplicate.delivery.issues[0].code).toBe("out-of-order-timestamp");
      expect(duplicate.received).toBe(next.received);
    }
  });
  it("copies the checked value without re-reading changing input accessors", () => {
    const values = envelope();
    const reads: Record<string, number> = {};
    const candidate = Object.create(null) as Record<string, unknown>;
    for (const [field, value] of Object.entries(values)) {
      Object.defineProperty(candidate, field, {
        enumerable: true,
        get: () => {
          reads[field] = (reads[field] ?? 0) + 1;
          return reads[field] === 1 ? value : Number.NaN;
        },
      });
    }
    Object.defineProperty(candidate, "ignoredExtra", {
      get: () => {
        throw new Error("Unknown fields must not be evaluated");
      },
    });
    const result = validateTelemetrySample(candidate, context);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sample).toEqual(values);
    for (const field of Object.keys(values)) expect(reads[field]).toBe(1);
  });
  it("accepts a valid owned whitelist copy and excludes extra input fields", () => {
    const raw = { ...envelope(), extra: "ignored" };
    const result = validateTelemetrySample(raw, context);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sample).toEqual(envelope());
    raw.oilPressure = -99;
    expect(result.sample.oilPressure).toBe(52);
    expect("extra" in result.sample).toBe(false);
  });
  it("rejects non-object payloads and arrays", () => {
    for (const bad of [null, undefined, false, 52, "sample", [], [envelope()]])
      rejection(bad, "malformed");
  });
  it("requires all own fields, including time and the exact supported version", () => {
    for (const field of ["contractVersion", "time", ...METRICS]) {
      const raw: Record<string, unknown> = { ...envelope() };
      delete raw[field];
      rejection(raw, "missing-field");
    }
    rejection(Object.create(envelope()), "missing-field");
    for (const version of [0, 2, "1", null, Number.NaN])
      rejection(
        { ...envelope(), contractVersion: version },
        "contract-version",
      );
  });
  it("does not coerce numeric strings, nulls, booleans, or objects for any numeric field", () => {
    for (const field of ["time", ...METRICS]) {
      for (const value of ["1", null, true, {}, [], undefined])
        rejection({ ...envelope(), [field]: value }, "numeric-type");
    }
  });
  it("rejects non-finite values for every numeric field", () => {
    for (const field of ["time", ...METRICS]) {
      for (const value of [
        Number.NaN,
        Number.POSITIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
      ])
        rejection({ ...envelope(), [field]: value }, "non-finite");
    }
  });
  it("accepts inclusive demonstration bounds and rejects values outside every metric range", () => {
    for (const metric of METRICS) {
      const bounds = TELEMETRY_CONTRACT.fields[metric];
      for (const value of [bounds.min, bounds.max])
        expect(
          validateTelemetrySample({ ...envelope(), [metric]: value }, context)
            .ok,
        ).toBe(true);
      for (const value of [bounds.min - 0.001, bounds.max + 0.001])
        rejection({ ...envelope(), [metric]: value }, "out-of-bounds");
    }
  });
  it("rejects negative, future, duplicate, and out-of-order timestamps consistently", () => {
    rejection({ ...envelope(), time: -0.5 }, "timestamp-bounds");
    rejection({ ...envelope(), time: 1.5 }, "future-timestamp");
    const duplicate = validateTelemetrySample(envelope(), {
      ...context,
      lastAcceptedTimestamp: 1,
    });
    expect(duplicate.issues.map((issue) => issue.code)).toEqual([
      "duplicate-timestamp",
    ]);
    const old = validateTelemetrySample(
      { ...envelope(), time: 0.5 },
      { ...context, lastAcceptedTimestamp: 1 },
    );
    expect(old.issues.map((issue) => issue.code)).toEqual([
      "out-of-order-timestamp",
    ]);
  });
  it("does not let malformed, duplicate, or old attempts replace values or refresh their age", () => {
    const original = createSimulation();
    const accepted = deliverTelemetry({ ...original, time: 1 }, envelope());
    for (const bad of [
      { ...envelope(), time: 2, coolantTemp: 999 },
      { ...envelope(), time: 2, oilPressure: Number.NaN },
      { ...envelope(), rpm: "1200" },
      { ...envelope(), coolantTemp: 250 },
      { ...envelope(), time: 0.5, oilPressure: 6 },
    ]) {
      const rejected = deliverTelemetry({ ...accepted, time: 2 }, bad);
      expect(rejected.received).toBe(accepted.received);
      expect(rejected.receivedAt).toBe(1);
      expect(rejected.delivery.status).toBe("rejected");
      expect(rejected.delivery.acceptedCount).toBe(
        accepted.delivery.acceptedCount,
      );
      expect(rejected.values).toEqual(accepted.values);
    }
  });
  it("uses delayed sample time for freshness and processes an accepted timestamp only once", () => {
    const initial = createSimulation();
    const oldButNewer = deliverTelemetry(
      { ...initial, time: 8 },
      { ...envelope(), time: 1, coolantTemp: 250 },
    );
    const diagnostics = updateDiagnostics(
      createDiagnostics(),
      oldButNewer,
      defaultSettings,
    );
    expect(oldButNewer.receivedAt).toBe(1);
    expect(diagnostics.alerts.communication.severity).toBe("critical");
    expect(diagnostics.alerts.coolantTemp.severity).toBe("normal");
    const recent = deliverTelemetry(
      { ...oldButNewer, time: 8.5 },
      { ...envelope(), time: 8, coolantTemp: 250 },
    );
    const first = updateDiagnostics(diagnostics, recent, defaultSettings);
    expect(first.alerts.communication.severity).toBe("normal");
    expect(first.alerts.coolantTemp.candidateSamples).toBe(1);
    const repeated = updateDiagnostics(first, recent, defaultSettings);
    expect(repeated.alerts.coolantTemp.candidateSamples).toBe(1);
    expect(repeated.alerts.coolantTemp.severity).toBe("normal");
  });
});

// Acquisition integrity: invalid attempts cannot refresh freshness or extend accepted history.
describe("delivery fault rejection, evidence, and recovery", () => {
  it("retains exact readings/history throughout rejected delivery while the process continues", () => {
    let state = ticks(
      createStudio(defaultSettings, "invalid-sample-delivery"),
      9,
    );
    const readings = state.simulation.received;
    const history = state.history;
    const physical = state.simulation.values;
    for (let index = 0; index < 24; index++) {
      state = studioReducer(state, { type: "tick" });
      expect(state.simulation.received).toBe(readings);
      expect(state.history).toBe(history);
      expect(state.simulation.receivedAt).toBe(4.5);
      expect(state.simulation.delivery.status).toBe("rejected");
    }
    expect(state.simulation.time).toBe(16.5);
    expect(state.simulation.values).not.toEqual(physical);
    expect(state.simulation.delivery.rejectedCount).toBe(24);
    expect(state.diagnostics.alerts.communication.severity).toBe("critical");
    for (const metric of METRICS)
      expect(state.diagnostics.alerts[metric].severity).toBe("normal");
    state = studioReducer(state, { type: "tick" });
    expect(state.simulation.delivery.status).toBe("recovered");
    expect(state.simulation.delivery.lastRecoveryAt).toBe(17);
    expect(state.simulation.delivery.consecutiveRejected).toBe(0);
    expect(state.simulation.received.time).toBe(17);
    expect(state.history).toHaveLength(11);
    expect(state.diagnostics.alerts.communication.severity).toBe("normal");
  });
  it("records one event per new rejection code and one recovery per continuous episode", () => {
    const state = ticks(
      createStudio(defaultSettings, "invalid-sample-delivery"),
      70,
    );
    const rejected = state.diagnostics.events.filter(
      (event) => event.kind === "validation",
    );
    expect(rejected).toHaveLength(5);
    expect(rejected.map((event) => event.time)).toEqual([5, 8, 9.5, 11, 14]);
    expect(rejected.map((event) => event.message).join("\n")).toContain(
      "out-of-order-timestamp",
    );
    const recovery = state.diagnostics.events.filter(
      (event) => event.kind === "recovery",
    );
    expect(recovery).toHaveLength(1);
    expect(recovery[0].time).toBe(17);
    expect(recovery[0].message).toContain("24 rejected attempts");
    const communication = state.diagnostics.events.filter(
      (event) =>
        event.kind === "transition" &&
        event.message.startsWith("Communication:"),
    );
    expect(communication.map((event) => event.time)).toEqual([6.5, 17]);
    expect(state.simulation.delivery.rejectedCount).toBe(24);
  });
  it("suppresses repeated rejection floods, caps retained evidence, and recognizes later episodes", () => {
    let simulation = createSimulation();
    let diagnostics = createDiagnostics();
    for (let index = 1; index <= 500; index++) {
      simulation = deliverTelemetry(
        { ...simulation, time: index * 0.5 },
        { ...envelope(), time: index * 0.5, rpm: Number.NaN },
      );
      diagnostics = updateDiagnostics(diagnostics, simulation, defaultSettings);
    }
    expect(simulation.delivery.rejectedCount).toBe(500);
    expect(
      diagnostics.events.filter((event) => event.kind === "validation"),
    ).toHaveLength(1);
    expect(simulation.delivery.episodeCodes).toEqual(["non-finite"]);
    for (let episode = 0; episode < 80; episode++) {
      simulation = deliverTelemetry(
        { ...simulation, time: simulation.time + 0.5 },
        { ...envelope(), time: simulation.time + 0.5 },
      );
      diagnostics = updateDiagnostics(diagnostics, simulation, defaultSettings);
      simulation = deliverTelemetry(
        { ...simulation, time: simulation.time + 0.5 },
        { ...envelope(), time: simulation.time + 0.5, rpm: Number.NaN },
      );
      diagnostics = updateDiagnostics(diagnostics, simulation, defaultSettings);
    }
    expect(diagnostics.events).toHaveLength(EVENT_CAPACITY);
    expect(new Set(diagnostics.events.map((event) => event.id)).size).toBe(
      EVENT_CAPACITY,
    );
    expect(diagnostics.events.at(-1)!.id).toBe(diagnostics.nextId - 1);
  });
});

// Guided scenarios compare process faults with delivery faults and verify shared ACK rules.
describe("additional deterministic guided process and delivery scenarios", () => {
  it.each(["oil-pressure-loss", "invalid-sample-delivery"] as const)(
    "replays %s with identical telemetry, rejection evidence, and bounded histories",
    (scenario) => {
      const first = ticks(createStudio(defaultSettings, scenario), 100);
      const replay = ticks(
        studioReducer(first, { type: "scenario", scenario }),
        100,
      );
      expect(replay).toEqual(first);
      const extended = ticks(first, 800);
      expect(extended.history).toHaveLength(HISTORY_CAPACITY);
      expect(extended.diagnostics.events.length).toBeLessThanOrEqual(
        EVENT_CAPACITY,
      );
      for (let index = 1; index < extended.history.length; index++)
        expect(extended.history[index].time).toBeGreaterThan(
          extended.history[index - 1].time,
        );
    },
  );
  it("progresses oil loss through warning/critical and hysteresis recovery without delivery rejection", () => {
    const state = ticks(createStudio(defaultSettings, "oil-pressure-loss"), 84);
    const transitions = state.diagnostics.events
      .filter((event) => event.message.startsWith("Oil pressure:"))
      .map((event) => event.message);
    expect(transitions).toHaveLength(4);
    expect(transitions[0]).toContain("normal → warning");
    expect(transitions[1]).toContain("warning → critical");
    expect(transitions[2]).toContain("critical → warning");
    expect(transitions[3]).toContain("warning → normal");
    expect(state.diagnostics.alerts.oilPressure.severity).toBe("normal");
    expect(state.simulation.delivery.rejectedCount).toBe(0);
    expect(state.simulation.received.oilPressure).toBeGreaterThan(40);
  });
  it("keeps acknowledged oil conditions active, requires escalation review, then clears on recovery", () => {
    let state = createStudio(defaultSettings, "oil-pressure-loss");
    for (
      let tick = 0;
      tick < 40 && state.diagnostics.alerts.oilPressure.severity !== "warning";
      tick++
    )
      state = studioReducer(state, { type: "tick" });
    expect(state.diagnostics.alerts.oilPressure.severity).toBe("warning");
    state = studioReducer(state, { type: "ack", key: "oilPressure" });
    expect(state.diagnostics.alerts.oilPressure.acknowledged).toBe(true);
    for (
      let tick = 0;
      tick < 30 && state.diagnostics.alerts.oilPressure.severity !== "critical";
      tick++
    )
      state = studioReducer(state, { type: "tick" });
    expect(state.diagnostics.alerts.oilPressure.severity).toBe("critical");
    expect(state.diagnostics.alerts.oilPressure.acknowledged).toBe(false);
    state = studioReducer(state, { type: "ack", key: "oilPressure" });
    expect(state.diagnostics.alerts.oilPressure.acknowledged).toBe(true);
    expect(state.diagnostics.alerts.oilPressure.severity).toBe("critical");
    state = ticks(state, 55);
    expect(state.diagnostics.alerts.oilPressure.severity).toBe("normal");
    expect(state.diagnostics.alerts.oilPressure.acknowledged).toBe(false);
    expect(
      state.diagnostics.events.filter(
        (event) => event.kind === "acknowledgment",
      ),
    ).toHaveLength(2);
  });
});
