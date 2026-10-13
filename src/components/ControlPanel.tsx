import { useState } from "react";
import { Play, Radio, RefreshCw } from "lucide-react";
import { formatTime, scenarios } from "../engine/model";
import type { Action } from "../engine/studio";
import type { Mode, ScenarioId, StudioState } from "../engine/types";

export function ControlPanel({
  state,
  dispatch,
}: {
  state: StudioState;
  dispatch: React.Dispatch<Action>;
}) {
  const s = state.simulation;
  const [selectedId, setSelectedId] = useState<Exclude<ScenarioId, "manual">>(
    s.scenario === "manual" ? "normal-ramp" : s.scenario,
  );
  const selectedScenario = scenarios.find((item) => item.id === selectedId)!;
  const scenario = scenarios.find((item) => item.id === s.scenario);
  const progress = scenario
    ? Math.min(100, (s.time / scenario.duration) * 100)
    : 0;
  return (
    <aside className="control-column">
      <section className="panel controls-panel">
        <div className="section-title">
          <h2>Simulation controls</h2>
          <span className="small-label">LOCAL</span>
        </div>
        <p className="muted small">
          One engine model. Six synchronized channels.
        </p>
        <label className="field-label" htmlFor="mode">
          Operating mode
        </label>
        <select
          id="mode"
          value={s.mode}
          onChange={(e) =>
            dispatch({ type: "mode", mode: e.target.value as Mode })
          }
        >
          {["Idle", "Normal", "High Load", "Fault"].map((mode) => (
            <option key={mode}>{mode}</option>
          ))}
        </select>
        <div className="range-label">
          <label htmlFor="rpm-target">Speed command</label>
          <strong className="mono">
            {Math.round(s.rpmTarget)} <span>rpm</span>
          </strong>
        </div>
        <input
          id="rpm-target"
          aria-label="Speed command"
          type="range"
          min="600"
          max="3400"
          step="50"
          value={s.rpmTarget}
          onChange={(e) =>
            dispatch({
              type: "target",
              metric: "rpm",
              value: Number(e.target.value),
            })
          }
        />
        <div className="range-ends">
          <span>600</span>
          <span>3,400 rpm</span>
        </div>
        <div className="range-label">
          <label htmlFor="load-target">Load command</label>
          <strong className="mono">
            {Math.round(s.loadTarget)} <span>%</span>
          </strong>
        </div>
        <input
          id="load-target"
          aria-label="Load command"
          type="range"
          min="0"
          max="100"
          step="1"
          value={s.loadTarget}
          onChange={(e) =>
            dispatch({
              type: "target",
              metric: "engineLoad",
              value: Number(e.target.value),
            })
          }
        />
        <div className="range-ends">
          <span>0</span>
          <span>100%</span>
        </div>
        <button
          className={`transport-button ${!s.transportEnabled ? "disconnected" : ""}`}
          onClick={() =>
            dispatch({ type: "transport", enabled: !s.transportEnabled })
          }
        >
          <Radio size={15} />
          {s.transportEnabled
            ? "Interrupt sample transport"
            : "Restore sample transport"}
        </button>
        <p className="micro muted">
          Mode, command, or transport changes exit guided replay. Pause suspends
          simulation time.
        </p>
      </section>
      <section className="panel scenario-panel">
        <div className="section-title">
          <h2>Guided scenarios</h2>
          <span className="small-label">REPLAYABLE</span>
        </div>
        <p className="muted small">Explore a repeatable operating sequence.</p>
        <div className="scenario-picker">
          <label className="field-label" htmlFor="guided-scenario">
            Scenario
          </label>
          <select
            id="guided-scenario"
            value={selectedId}
            aria-describedby="scenario-description"
            onChange={(event) => {
              const selected = scenarios.find(
                (item) => item.id === event.target.value,
              );
              if (selected) setSelectedId(selected.id);
            }}
          >
            {scenarios.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
          <p
            id="scenario-description"
            className="scenario-description"
            data-testid="scenario-description"
          >
            {selectedScenario.description}{" "}
            <span className="scenario-domain">
              {selectedScenario.faultDomain === "delivery"
                ? "Sample delivery"
                : selectedScenario.faultDomain === "process"
                  ? "Simulated process"
                  : "Normal process"}
            </span>
          </p>
          <button
            className="button primary scenario-run"
            onClick={() => dispatch({ type: "scenario", scenario: selectedId })}
          >
            <Play size={16} /> Run scenario
          </button>
          <p className="micro muted scenario-start-note">
            Starting a replay resets the session.
          </p>
        </div>
        {scenario && (
          <div className="scenario-explainer" data-testid="scenario-explainer">
            <strong className="scenario-active">
              Active scenario: {scenario.title}
            </strong>
            <span className="scenario-domain">
              {scenario.faultDomain === "delivery"
                ? "Sample delivery fault"
                : scenario.faultDomain === "process"
                  ? "Simulated process fault"
                  : "Normal process"}
            </span>
            <div className="range-label">
              <strong>
                {progress >= 100 ? "Sequence complete" : "Sequence in progress"}
              </strong>
              <span className="mono">
                {formatTime(Math.min(s.time, scenario.duration))} /{" "}
                {formatTime(scenario.duration)}
              </span>
            </div>
            <div className="progress-track">
              <span style={{ width: `${progress}%` }} />
            </div>
            <p>{scenario.expected}</p>
            <button
              className="text-button"
              onClick={() =>
                dispatch({ type: "scenario", scenario: scenario.id })
              }
            >
              <RefreshCw size={14} />
              Replay scenario
            </button>
          </div>
        )}
      </section>
    </aside>
  );
}
