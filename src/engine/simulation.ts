/**
 * Deterministic process model and scripted delivery faults for the browser demo.
 * studio-state.ts calls one fixed step per tick. This module evolves generated
 * process values, wraps them in the telemetry contract, and delivers candidates
 * through telemetry.ts before any instrument or diagnostic uses a new reading.
 *
 * Speed, load, temperature, pressure, voltage, and fuel are illustrative coupled
 * responses, not a validated engine model. There is no sensor, CAN, Modbus, PLC,
 * or actuator connection. A production acquisition adapter would need separate
 * timing, protocol decoding, quality, and safety requirements; this model cannot
 * establish the response of real equipment or a real-time control loop.
 */
import { DEFAULT_SEED, MODE_TARGETS, UPDATE_MS } from "./instruments";
import {
  createTelemetryEnvelope,
  deliverTelemetry,
  validateTelemetrySample,
} from "./telemetry";
import type { Mode, ScenarioId, Simulation, Telemetry } from "./types";

// Shared numeric helper; callers validate finiteness where external values enter.
export function clamp(value: number, low: number, high: number) {
  return Math.max(low, Math.min(high, value));
}
/**
 * Prepare a reproducible time-zero sample and validate it through the same
 * contract used for later delivery. The initial received copy is independent of
 * generated values. A manual session can still display standby: that separate
 * presentation lifecycle is tracked by hasStarted in studio-state.ts.
 */
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
  const initial = validateTelemetrySample(createTelemetryEnvelope(values), {
    simulationTime: 0,
  });
  if (!initial.ok) {
    throw new Error(
      `Initial telemetry violates the contract: ${initial.issues.map((issue) => issue.message).join(" ")}`,
    );
  }
  const { contractVersion: _version, ...received } = initial.sample;
  return {
    time: 0,
    seed: seed >>> 0 || DEFAULT_SEED,
    randomState: seed >>> 0 || DEFAULT_SEED,
    mode: startIdle ? "Idle" : "Normal",
    scenario,
    rpmTarget: values.rpm,
    loadTarget: values.engineLoad,
    transportEnabled: true,
    receivedAt: received.time,
    values,
    received,
    delivery: {
      contractVersion: 1,
      status: "accepted",
      acceptedCount: 1,
      rejectedCount: 0,
      consecutiveRejected: 0,
      lastAttemptAt: 0,
      lastRejectedAt: null,
      lastRecoveryAt: null,
      issues: [],
      episodeCodes: [],
      notices: [],
    },
  };
}
// Manual mode changes exit guided replay and set common model targets. Actual
// readings approach those targets over subsequent steps rather than jumping.
export function setMode(simulation: Simulation, mode: Mode): Simulation {
  return {
    ...simulation,
    mode,
    scenario: "manual",
    rpmTarget: MODE_TARGETS[mode].rpm,
    loadTarget: MODE_TARGETS[mode].load,
  };
}

/**
 * Advance by UPDATE_MS in simulation time, irrespective of wall-clock delay.
 * The xorshift state below produces repeatable small noise; it is not a
 * cryptographic random generator and is used only for simulated measurements.
 */
export function advanceSimulation(previous: Simulation): Simulation {
  const s = { ...previous, delivery: { ...previous.delivery, notices: [] } };
  s.time = +(s.time + UPDATE_MS / 1000).toFixed(3);
  let x = s.randomState;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  s.randomState = x >>> 0;
  const noise = s.randomState / 4294967296 - 0.5;
  // A normal ramp changes targets on a fixed timeline. In other scenarios the
  // selected mode supplies the same speed/load inputs to the coupled model.
  if (s.scenario === "normal-ramp") {
    const ramp = clamp((s.time - 3) / 22, 0, 1);
    s.rpmTarget = 800 + ramp * 950;
    s.loadTarget = 12 + ramp * 40;
    s.mode = s.time < 3 ? "Idle" : "Normal";
  }
  // Process evolution reads generated truth, even during an outage. Response
  // factors and clamps are illustrative per-step behavior, not physical units
  // for controller tuning or a claim of sensor/calibration accuracy.
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
  // Process faults change target conditions: thermal degradation persists until
  // reset, while oil-pressure loss restores its normal target at 24 seconds.
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
  const oilLoss =
    s.scenario === "oil-pressure-loss" && s.time >= 5 && s.time < 24;
  const pressureTarget = oilLoss
    ? 6
    : fault
      ? 11
      : 17 +
        rpm * 0.024 -
        engineLoad * 0.035 -
        Math.max(0, coolantTemp - 210) * 0.1;
  const pressureResponse =
    oilLoss || (s.scenario === "oil-pressure-loss" && s.time >= 24)
      ? 0.075
      : 0.18;
  const oilPressure = clamp(
    v.oilPressure +
      (pressureTarget - v.oilPressure) * pressureResponse +
      noise * 0.18,
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
  // Delivery faults affect observation, not process truth. A transport outage
  // produces no attempt; invalid delivery attempts are rejected by telemetry.ts.
  // Both leave received readings aging until valid measurement delivery resumes.
  const scenarioDrop =
    s.scenario === "communication-loss" && s.time >= 5 && s.time < 17;
  if (s.transportEnabled && !scenarioDrop) {
    const candidate: Record<string, unknown> = createTelemetryEnvelope(
      s.values,
    );
    if (
      s.scenario === "invalid-sample-delivery" &&
      s.time >= 5 &&
      s.time < 17
    ) {
      // Inject distinct rejection reasons at known times so a demo can explain
      // invalid values, missing/type errors, duplicates, and older timestamps.
      // The underlying generated process stays normal and deterministic.
      if (s.time < 8) candidate.oilPressure = Number.NaN;
      else if (s.time < 9.5) delete candidate.batteryVoltage;
      else if (s.time < 11) candidate.rpm = "not-a-number";
      else if (s.time < 14) candidate.time = previous.received.time;
      else candidate.time = previous.received.time - 0.5;
    }
    return deliverTelemetry(s, candidate);
  }
  return s;
}
