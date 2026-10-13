import { describe, expect, it } from "vitest";
import { createStudio, studioReducer } from "../src/engine/studio";

describe("display standby lifecycle", () => {
  it("wakes once, holds through a pause before the first tick, and returns to standby on reset", () => {
    let state = createStudio();
    const prepared = state.simulation.received;
    expect(state.hasStarted).toBe(false);
    state = studioReducer(state, { type: "start" });
    expect(state.hasStarted).toBe(true);
    expect(state.simulation.received).toBe(prepared);
    state = studioReducer(state, { type: "pause" });
    expect(state.hasStarted).toBe(true);
    expect(state.simulation.time).toBe(0);
    expect(state.simulation.received).toBe(prepared);
    state = studioReducer(state, { type: "reset" });
    expect(state.hasStarted).toBe(false);
    expect(state.running).toBe(false);
  });
  it("guided replay wakes the display while commands alone preserve standby", () => {
    let state = createStudio();
    state = studioReducer(state, { type: "mode", mode: "High Load" });
    state = studioReducer(state, {
      type: "target",
      metric: "rpm",
      value: 2200,
    });
    state = studioReducer(state, { type: "transport", enabled: false });
    expect(state.hasStarted).toBe(false);
    state = studioReducer(state, { type: "scenario", scenario: "normal-ramp" });
    expect(state.hasStarted).toBe(true);
    expect(state.running).toBe(true);
    expect(state.simulation.received.rpm).toBeGreaterThan(0);
  });
});
