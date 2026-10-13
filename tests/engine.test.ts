import { describe, expect, it } from "vitest";
import {
  acknowledge,
  activeAlerts,
  addEvent,
  classify,
  createDiagnostics,
  updateDiagnostics,
} from "../src/engine/diagnostics";
import {
  DEFAULT_SEED,
  EVENT_CAPACITY,
  HISTORY_CAPACITY,
  displayUnit,
  displayValue,
  UPDATE_MS,
} from "../src/engine/model";
import {
  defaultSettings,
  readSettings,
  SETTINGS_KEY,
  validateSettings,
  validateThreshold,
  writeSettings,
} from "../src/engine/settings";
import {
  advanceSimulation,
  createSimulation,
  setMode,
} from "../src/engine/simulation";
import {
  createStudio,
  exportEvents,
  exportTelemetry,
  studioReducer,
} from "../src/engine/studio";
import { METRICS, type Mode, type StudioState } from "../src/engine/types";

function ticks(state: StudioState, count: number) {
  for (let i = 0; i < count; i++)
    state = studioReducer(state, { type: "tick" });
  return state;
}
function memoryStorage(raw: string | null = null) {
  let value = raw;
  return {
    getItem: () => value,
    setItem: (_: string, data: string) => {
      value = data;
    },
  };
}
describe("central deterministic simulation", () => {
  it("replays the same exact trajectory with the same seed", () => {
    let a = createSimulation("overheat", DEFAULT_SEED),
      b = createSimulation("overheat", DEFAULT_SEED);
    for (let i = 0; i < 200; i++) {
      a = advanceSimulation(a);
      b = advanceSimulation(b);
      expect(a).toEqual(b);
    }
  });
  it("uses different seeds for different noise while preserving bounds", () => {
    expect(
      advanceSimulation(createSimulation("manual", 4)).values.rpm,
    ).not.toBe(advanceSimulation(createSimulation("manual", 5)).values.rpm);
  });
  it.each(["Idle", "Normal", "High Load", "Fault"] as Mode[])(
    "keeps all channels finite and bounded in %s",
    (mode) => {
      let simulation = setMode(createSimulation(), mode);
      let lastFuel = simulation.values.fuelLevel;
      for (let i = 0; i < 2400; i++) {
        simulation = advanceSimulation(simulation);
        for (const metric of METRICS)
          expect(Number.isFinite(simulation.values[metric])).toBe(true);
        expect(simulation.values.rpm).toBeGreaterThanOrEqual(600);
        expect(simulation.values.rpm).toBeLessThanOrEqual(3600);
        expect(simulation.values.oilPressure).toBeGreaterThanOrEqual(0);
        expect(simulation.values.oilPressure).toBeLessThanOrEqual(100);
        expect(simulation.values.coolantTemp).toBeGreaterThanOrEqual(100);
        expect(simulation.values.coolantTemp).toBeLessThanOrEqual(280);
        expect(simulation.values.batteryVoltage).toBeGreaterThanOrEqual(10);
        expect(simulation.values.batteryVoltage).toBeLessThanOrEqual(16);
        expect(simulation.values.engineLoad).toBeGreaterThanOrEqual(0);
        expect(simulation.values.engineLoad).toBeLessThanOrEqual(100);
        expect(simulation.values.fuelLevel).toBeGreaterThanOrEqual(0);
        expect(simulation.values.fuelLevel).toBeLessThanOrEqual(lastFuel);
        lastFuel = simulation.values.fuelLevel;
      }
    },
  );
  it("raises speed and oil pressure together while temperature responds slowly", () => {
    const initial = createSimulation();
    let s = setMode(initial, "High Load");
    for (let i = 0; i < 20; i++) s = advanceSimulation(s);
    expect(s.values.rpm).toBeGreaterThan(initial.values.rpm + 700);
    expect(s.values.oilPressure).toBeGreaterThan(
      initial.values.oilPressure + 10,
    );
    expect(s.values.coolantTemp).toBeLessThan(200);
  });
  it("freezes all received values during the communication outage and recovers", () => {
    let s = createSimulation("communication-loss");
    for (let i = 0; i < 9; i++) s = advanceSimulation(s);
    const received = s.received;
    for (let i = 0; i < 24; i++) {
      s = advanceSimulation(s);
      expect(s.received).toEqual(received);
    }
    expect(s.time).toBe(16.5);
    expect(s.values.time).toBe(16.5);
    s = advanceSimulation(s);
    expect(s.received.time).toBe(17);
    expect(s.receivedAt).toBe(17);
  });
});
describe("state transitions and reproducible scenarios", () => {
  it("starts ready and ignores ticks until started", () => {
    const state = createStudio();
    expect(state.running).toBe(false);
    expect(studioReducer(state, { type: "tick" })).toBe(state);
    expect(
      ticks(studioReducer(state, { type: "start" }), 2).simulation.time,
    ).toBe((UPDATE_MS / 1000) * 2);
  });
  it("pause prevents time, samples, and diagnostic state from advancing", () => {
    const s = studioReducer(
      ticks(createStudio(defaultSettings, "communication-loss"), 14),
      { type: "pause" },
    );
    expect(ticks(s, 100)).toBe(s);
  });
  it("reset clears session alerts and samples while preserving preferences", () => {
    const settings = { ...defaultSettings, theme: "day" as const };
    const state = ticks(createStudio(settings, "overheat"), 70);
    expect(activeAlerts(state.diagnostics).length).toBeGreaterThan(0);
    const reset = studioReducer(state, { type: "reset" });
    expect(reset.running).toBe(false);
    expect(reset.history).toHaveLength(1);
    expect(activeAlerts(reset.diagnostics)).toHaveLength(0);
    expect(reset.settings.theme).toBe("day");
  });
  it("normal ramp changes telemetry without an alert at default thresholds", () => {
    const state = ticks(createStudio(defaultSettings, "normal-ramp"), 70);
    expect(state.simulation.received.rpm).toBeGreaterThan(1700);
    expect(state.simulation.received.engineLoad).toBeGreaterThan(50);
    expect(activeAlerts(state.diagnostics)).toHaveLength(0);
  });
  it("overheat visibly progresses through warning and critical", () => {
    const state = ticks(createStudio(defaultSettings, "overheat"), 70);
    const messages = state.diagnostics.events.map((e) => e.message).join("\n");
    expect(messages).toContain("Coolant temperature: normal → warning");
    expect(messages).toContain("Coolant temperature: warning → critical");
    expect(state.diagnostics.alerts.coolantTemp.severity).toBe("critical");
  });
  it("communication loss has one onset and one recovery with bounded history", () => {
    const onset = ticks(
      createStudio(defaultSettings, "communication-loss"),
      13,
    );
    expect(onset.diagnostics.alerts.communication.severity).toBe("critical");
    const frozen = ticks(onset, 8);
    expect(frozen.history).toHaveLength(onset.history.length);
    const recovered = ticks(frozen, 14);
    expect(recovered.diagnostics.alerts.communication.severity).toBe("normal");
    const transitions = recovered.diagnostics.events.filter(
      (e) => e.kind === "transition" && e.message.startsWith("Communication:"),
    );
    expect(transitions).toHaveLength(2);
    expect(transitions[0].time).toBe(6.5);
    expect(transitions[1].time).toBe(17);
  });
  it("manual adjustments exit replay and clamp command limits", () => {
    const s = createStudio(defaultSettings, "normal-ramp");
    const rpm = studioReducer(s, {
      type: "target",
      metric: "rpm",
      value: 100000,
    });
    expect(rpm.simulation.rpmTarget).toBe(3400);
    expect(rpm.simulation.scenario).toBe("manual");
    expect(
      studioReducer(s, { type: "target", metric: "engineLoad", value: -2 })
        .simulation.loadTarget,
    ).toBe(0);
    expect(
      studioReducer(s, { type: "target", metric: "rpm", value: NaN }),
    ).toBe(s);
  });
  it("bounds history and timestamps every retained sample monotonically", () => {
    const s = ticks(studioReducer(createStudio(), { type: "start" }), 1500);
    expect(s.history).toHaveLength(HISTORY_CAPACITY);
    expect(s.history[0].time).toBe(630.5);
    expect(s.history.at(-1)!.time).toBe(750);
  });
  it("replaying a scenario resets its seed and exact data sequence", () => {
    const first = ticks(createStudio(defaultSettings, "overheat"), 40);
    const replay = ticks(
      studioReducer(first, { type: "scenario", scenario: "overheat" }),
      40,
    );
    expect(replay).toEqual(first);
  });
});
describe("diagnostic rules", () => {
  it("triggers exact upper warning and critical boundaries", () => {
    const rule = defaultSettings.thresholds.coolantTemp;
    expect(classify(219.99, rule, "normal")).toBe("normal");
    expect(classify(220, rule, "normal")).toBe("warning");
    expect(classify(235, rule, "normal")).toBe("critical");
  });
  it("requires hysteresis recovery at upper boundaries", () => {
    const rule = defaultSettings.thresholds.coolantTemp;
    expect(classify(231, rule, "critical")).toBe("critical");
    expect(classify(230.9, rule, "critical")).toBe("warning");
    expect(classify(216, rule, "warning")).toBe("warning");
    expect(classify(215.9, rule, "warning")).toBe("normal");
  });
  it("uses lower thresholds and hysteresis for oil pressure", () => {
    const rule = defaultSettings.thresholds.oilPressure;
    expect(classify(24, rule, "normal")).toBe("warning");
    expect(classify(16, rule, "normal")).toBe("critical");
    expect(classify(19, rule, "critical")).toBe("critical");
    expect(classify(19.1, rule, "critical")).toBe("warning");
    expect(classify(27, rule, "warning")).toBe("warning");
    expect(classify(27.1, rule, "warning")).toBe("normal");
  });
  it("debounces received samples and deduplicates sustained alerts", () => {
    let d = createDiagnostics();
    const s = createSimulation();
    s.received.coolantTemp = 225;
    d = updateDiagnostics(d, s, defaultSettings);
    expect(d.alerts.coolantTemp.severity).toBe("normal");
    d = updateDiagnostics(d, s, defaultSettings);
    expect(d.alerts.coolantTemp.severity).toBe("warning");
    for (let i = 0; i < 30; i++) d = updateDiagnostics(d, s, defaultSettings);
    expect(d.events).toHaveLength(1);
    expect(activeAlerts(d)).toHaveLength(1);
  });
  it("does not count undelivered duplicate samples toward debounce", () => {
    const s = createSimulation();
    s.received.coolantTemp = 225;
    const initial = updateDiagnostics(createDiagnostics(), s, defaultSettings);
    const delayed = { ...s, time: 1 };
    const d = updateDiagnostics(initial, delayed, defaultSettings);
    expect(d.alerts.coolantTemp.severity).toBe("normal");
    expect(d.alerts.coolantTemp.candidateSamples).toBe(1);
  });
  it("acknowledges once, retains the condition, and requires new acknowledgment on escalation", () => {
    let state = ticks(createStudio(defaultSettings, "overheat"), 35);
    expect(state.diagnostics.alerts.coolantTemp.severity).toBe("warning");
    state = studioReducer(state, { type: "ack", key: "coolantTemp" });
    expect(state.diagnostics.alerts.coolantTemp.acknowledged).toBe(true);
    expect(activeAlerts(state.diagnostics)).toHaveLength(1);
    expect(
      acknowledge(state.diagnostics, "coolantTemp", state.simulation.time),
    ).toBe(state.diagnostics);
    state = ticks(state, 35);
    expect(state.diagnostics.alerts.coolantTemp.severity).toBe("critical");
    expect(state.diagnostics.alerts.coolantTemp.acknowledged).toBe(false);
  });
  it("does not acknowledge a normal channel", () => {
    const d = createDiagnostics();
    expect(acknowledge(d, "rpm", 0)).toBe(d);
  });
  it("caps events and maintains monotonic unique identifiers", () => {
    let d = createDiagnostics();
    for (let i = 0; i < 300; i++) d = addEvent(d, i, `Event ${i}`);
    expect(d.events).toHaveLength(EVENT_CAPACITY);
    expect(d.events[0].id).toBe(201);
    expect(d.nextId).toBe(301);
  });
});
describe("settings persistence and exports", () => {
  it("roundtrips validated preferences", () => {
    const storage = memoryStorage();
    const s = structuredClone(defaultSettings);
    s.units = "metric";
    s.visible.rpm = false;
    expect(writeSettings(storage, s)).toBe(true);
    expect(readSettings(storage)).toEqual(s);
  });
  it("restores defaults from malformed JSON and blocked storage", () => {
    expect(readSettings(memoryStorage("{broken"))).toEqual(defaultSettings);
    const blocked = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(readSettings(blocked)).toEqual(defaultSettings);
    expect(writeSettings(blocked, defaultSettings)).toBe(false);
  });
  it("rejects invalid ordering, bounds, direction, and recovery margin", () => {
    const rule = defaultSettings.thresholds.coolantTemp;
    for (const bad of [
      { ...rule, warning: 240 },
      { ...rule, critical: 400 },
      { ...rule, hysteresis: 0 },
      { ...rule, hysteresis: 20 },
      { ...rule, warning: NaN },
      { ...rule, direction: "below" as const },
    ])
      expect(validateThreshold("coolantTemp", bad)).not.toBeNull();
    expect(validateThreshold("coolantTemp", rule)).toBeNull();
  });
  it("sanitizes untrusted stored fields independently", () => {
    const s = validateSettings({
      theme: "invalid",
      units: "metric",
      debounceSamples: 0,
      timeoutSeconds: Infinity,
      visible: { rpm: "false" },
      thresholds: {
        coolantTemp: {
          ...defaultSettings.thresholds.coolantTemp,
          warning: 260,
        },
      },
    });
    expect(s.theme).toBe("night");
    expect(s.units).toBe("metric");
    expect(s.debounceSamples).toBe(2);
    expect(s.timeoutSeconds).toBe(2);
    expect(validateSettings({ timeoutSeconds: 4.2 }).timeoutSeconds).toBe(2);
    expect(validateSettings({ timeoutSeconds: 7 }).timeoutSeconds).toBe(7);
    expect(s.visible.rpm).toBe(true);
    expect(s.thresholds.coolantTemp).toEqual(
      defaultSettings.thresholds.coolantTemp,
    );
  });
  it("converts display units without changing canonical model values", () => {
    expect(displayValue("coolantTemp", 212, "metric")).toBe(100);
    expect(displayValue("oilPressure", 1, "metric")).toBeCloseTo(6.894757);
    expect(displayUnit("coolantTemp", "metric")).toBe("°C");
    expect(displayUnit("rpm", "metric")).toBe("rpm");
  });
  it("exports only retained samples with a simulation disclaimer", () => {
    const s = ticks(studioReducer(createStudio(), { type: "start" }), 300);
    const rows = exportTelemetry(s).split("\r\n");
    expect(rows).toHaveLength(HISTORY_CAPACITY + 1);
    expect(rows[0]).toContain("coolant_f");
    expect(rows[1]).toContain("SIMULATED - NOT LIVE EQUIPMENT");
  });
  it("quotes event commas, quotes, and line breaks correctly", () => {
    const s = createStudio();
    s.diagnostics = addEvent(s.diagnostics, 1, 'A "quoted", event\nnext line');
    expect(exportEvents(s)).toContain('"A ""quoted"", event\nnext line"');
    expect(exportEvents(s)).toContain("SIMULATED - NOT LIVE EQUIPMENT");
    expect(SETTINGS_KEY).toContain("v1");
  });
});
