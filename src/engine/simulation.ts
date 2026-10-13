import { DEFAULT_SEED, MODE_TARGETS, UPDATE_MS } from "./model";
import type { Mode, ScenarioId, Simulation, Telemetry } from "./types";

export function clamp(value: number, low: number, high: number) {
  return Math.max(low, Math.min(high, value));
}
export function createSimulation(
  scenario: ScenarioId = "manual",
  seed = DEFAULT_SEED,
): Simulation {
  const startIdle = scenario === "normal-ramp";
  const values: Telemetry = {
    time: 0,
    rpm: startIdle ? 800 : 1650,
    oilPressure: startIdle ? 33 : 52,
    coolantTemp: 182,
    batteryVoltage: 13.8,
    fuelLevel: 76,
    engineLoad: startIdle ? 12 : 48,
  };
  return {
    time: 0,
    seed: seed >>> 0 || DEFAULT_SEED,
    randomState: seed >>> 0 || DEFAULT_SEED,
    mode: startIdle ? "Idle" : "Normal",
    scenario,
    rpmTarget: values.rpm,
    loadTarget: values.engineLoad,
    transportEnabled: true,
    receivedAt: 0,
    values,
    received: { ...values },
  };
}
export function setMode(simulation: Simulation, mode: Mode): Simulation {
  return {
    ...simulation,
    mode,
    scenario: "manual",
    rpmTarget: MODE_TARGETS[mode].rpm,
    loadTarget: MODE_TARGETS[mode].load,
  };
}

// Fixed simulation time makes seeded replays independent of wall-clock scheduling.
export function advanceSimulation(previous: Simulation): Simulation {
  const s = { ...previous };
  s.time = +(s.time + UPDATE_MS / 1000).toFixed(3);
  let x = s.randomState;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  s.randomState = x >>> 0;
  const noise = s.randomState / 4294967296 - 0.5;
  if (s.scenario === "normal-ramp") {
    const ramp = clamp((s.time - 3) / 22, 0, 1);
    s.rpmTarget = 800 + ramp * 950;
    s.loadTarget = 12 + ramp * 40;
    s.mode = s.time < 3 ? "Idle" : "Normal";
  }
  const v = previous.values;
  const rpm = clamp(
    v.rpm + (s.rpmTarget - v.rpm) * 0.14 + noise * 5,
    600,
    3600,
  );
  const engineLoad = clamp(
    v.engineLoad + (s.loadTarget - v.engineLoad) * 0.12 + noise * 0.25,
    0,
    100,
  );
  const overheating = s.scenario === "overheat" && s.time >= 6;
  const fault = s.mode === "Fault";
  const thermalTarget = overheating
    ? 272
    : fault
      ? 264
      : 153 + engineLoad * 0.64 + rpm * 0.006;
  const coolantTemp = clamp(
    v.coolantTemp +
      (thermalTarget - v.coolantTemp) * (overheating || fault ? 0.035 : 0.009),
    100,
    280,
  );
  const pressureTarget = fault
    ? 11
    : 17 +
      rpm * 0.024 -
      engineLoad * 0.035 -
      Math.max(0, coolantTemp - 210) * 0.1;
  const oilPressure = clamp(
    v.oilPressure + (pressureTarget - v.oilPressure) * 0.18 + noise * 0.18,
    0,
    100,
  );
  const batteryTarget = fault ? 11.4 : rpm < 1000 ? 13.2 : 14.1;
  const batteryVoltage = clamp(
    v.batteryVoltage + (batteryTarget - v.batteryVoltage) * 0.1 + noise * 0.008,
    10,
    16,
  );
  const fuelLevel = clamp(
    v.fuelLevel - ((0.0008 + engineLoad * 0.000025) * UPDATE_MS) / 1000,
    0,
    100,
  );
  s.values = {
    time: s.time,
    rpm,
    oilPressure,
    coolantTemp,
    batteryVoltage,
    fuelLevel,
    engineLoad,
  };
  const scenarioDrop =
    s.scenario === "communication-loss" && s.time >= 5 && s.time < 17;
  if (s.transportEnabled && !scenarioDrop) {
    s.received = { ...s.values };
    s.receivedAt = s.time;
  }
  return s;
}
