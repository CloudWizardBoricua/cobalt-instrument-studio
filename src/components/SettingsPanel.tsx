/**
 * Preferences and demonstration diagnostic-rule editor.
 * ThresholdEditor keeps string drafts until explicit validation/save; SettingsPanel dispatches
 * complete settings through the reducer and reports whether browser persistence succeeded.
 * Metric display conversion does not change canonical psi/degree-F thresholds. Hysteresis
 * and debounce illustrate alarm chatter control; these are unqualified simulator rules.
 * Production engineering changes would need authorization, versioning and durable auditing,
 * none of which this local preferences form implements.
 */
import { useEffect, useState } from "react";
import { Check, Save, RotateCcw, Sun, Moon } from "lucide-react";
import { metricInfo } from "../engine/instruments";
import { defaultSettings, validateThreshold } from "../engine/settings";
import type { Action } from "../engine/studio-state";
import {
  METRICS,
  type Metric,
  type Settings,
  type Threshold,
} from "../engine/types";

// Each metric owns a draft and feedback; external reset resynchronizes the draft via effect.
function ThresholdEditor({
  metric,
  settings,
  dispatch,
}: {
  metric: Metric;
  settings: Settings;
  dispatch: React.Dispatch<Action>;
}) {
  const rule = settings.thresholds[metric];
  const [draft, setDraft] = useState({
    warning: String(rule.warning),
    critical: String(rule.critical),
    hysteresis: String(rule.hysteresis),
  });
  const [feedback, setFeedback] = useState("");
  useEffect(() => {
    setDraft({
      warning: String(rule.warning),
      critical: String(rule.critical),
      hysteresis: String(rule.hysteresis),
    });
  }, [rule.warning, rule.critical, rule.hysteresis]);
// Reject blank/non-finite/invalid ordering before replacing this metric rule atomically.
  function save() {
    const parsed: Threshold = {
      direction: rule.direction,
      warning: draft.warning.trim() === "" ? NaN : Number(draft.warning),
      critical: draft.critical.trim() === "" ? NaN : Number(draft.critical),
      hysteresis:
        draft.hysteresis.trim() === "" ? NaN : Number(draft.hysteresis),
    };
    const error = validateThreshold(metric, parsed);
    if (error) {
      setFeedback(error);
      return;
    }
    dispatch({
      type: "settings",
      settings: {
        ...settings,
        thresholds: { ...settings.thresholds, [metric]: parsed },
      },
    });
    setFeedback("Saved");
  }
  return (
    <div className="threshold-row">
      <div className="threshold-name">
        <strong>{metricInfo[metric].label}</strong>
        <small>
          Triggers {rule.direction} · {metricInfo[metric].unit}
        </small>
      </div>
      {(["warning", "critical", "hysteresis"] as const).map((field) => (
        <label key={field}>
          <span>{field === "hysteresis" ? "Recovery margin" : field}</span>
          <input
            type="number"
            step={metric === "batteryVoltage" ? "0.1" : "1"}
            aria-label={`${metricInfo[metric].label} ${field}`}
            value={draft[field]}
            onChange={(e) => {
              setDraft({ ...draft, [field]: e.target.value });
              setFeedback("");
            }}
          />
        </label>
      ))}
      <button
        className="button secondary small-button"
        onClick={save}
        aria-label={`Save ${metricInfo[metric].label} thresholds`}
      >
        <Save size={14} />
        Save
      </button>
      {feedback && (
        <p
          className={`threshold-feedback ${feedback === "Saved" ? "normal" : "critical"}`}
          role="status"
        >
          {feedback}
        </p>
      )}
    </div>
  );
}
// Merge a local preference patch into current settings; the reducer validates the full object.
export function SettingsPanel({
  settings,
  dispatch,
  persisted,
}: {
  settings: Settings;
  dispatch: React.Dispatch<Action>;
  persisted: boolean;
}) {
  const update = (patch: Partial<Settings>) =>
    dispatch({ type: "settings", settings: { ...settings, ...patch } });
  return (
    <div className="settings-layout">
      <section className="panel preferences-panel">
        <div className="section-title">
          <h2>Display preferences</h2>
          <span className="small-label">
            {persisted ? "SAVED LOCALLY" : "SESSION ONLY"}
          </span>
        </div>
        <p className="muted small">
          Preferences are stored in this browser when storage is available.
        </p>
        <h3>Appearance</h3>
        <div className="segmented">
          <button
            className={settings.theme === "night" ? "selected" : ""}
            aria-pressed={settings.theme === "night"}
            onClick={() => update({ theme: "night" })}
          >
            <Moon size={15} />
            Night
          </button>
          <button
            className={settings.theme === "day" ? "selected" : ""}
            aria-pressed={settings.theme === "day"}
            onClick={() => update({ theme: "day" })}
          >
            <Sun size={15} />
            Day
          </button>
        </div>
        <h3>Display units</h3>
        <div className="segmented">
          <button
            className={settings.units === "imperial" ? "selected" : ""}
            aria-pressed={settings.units === "imperial"}
            onClick={() => update({ units: "imperial" })}
          >
            Imperial
          </button>
          <button
            className={settings.units === "metric" ? "selected" : ""}
            aria-pressed={settings.units === "metric"}
            onClick={() => update({ units: "metric" })}
          >
            Metric
          </button>
        </div>
        <h3>Visible instruments</h3>
        <div className="visibility-list">
          {METRICS.map((metric) => (
            <label key={metric}>
              <input
                type="checkbox"
                checked={settings.visible[metric]}
                onChange={(e) =>
                  update({
                    visible: {
                      ...settings.visible,
                      [metric]: e.target.checked,
                    },
                  })
                }
              />
              <span>{metricInfo[metric].label}</span>
              {settings.visible[metric] && <Check size={14} />}
            </label>
          ))}
        </div>
        <button
          className="button secondary"
          onClick={() =>
            dispatch({
              type: "settings",
              settings: structuredClone(defaultSettings),
            })
          }
        >
          <RotateCcw size={14} />
          Restore default settings
        </button>
      </section>
{/* Canonical thresholds are separate from unit appearance and display-only workspace scales. */}
      <section className="panel thresholds-panel">
        <div className="section-title">
          <h2>Diagnostic thresholds</h2>
          <span className="small-label">VALIDATED ON SAVE</span>
        </div>
        <p className="muted small">
          Thresholds use canonical psi and °F, even in metric display mode. A
          recovery margin prevents boundary chatter. Acknowledged alerts remain
          active until the condition clears.
        </p>
        <div className="diagnostic-settings">
          <label>
            Debounce samples
            <select
              aria-label="Debounce samples"
              value={settings.debounceSamples}
              onChange={(e) =>
                update({ debounceSamples: Number(e.target.value) })
              }
            >
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i} value={i + 1}>
                  {i + 1} sample{i ? "s" : ""}
                </option>
              ))}
            </select>
          </label>
          <label>
            Communication timeout
            <select
              aria-label="Communication timeout"
              value={settings.timeoutSeconds}
              onChange={(e) =>
                update({ timeoutSeconds: Number(e.target.value) })
              }
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} seconds
                </option>
              ))}
            </select>
          </label>
        </div>
        <div>
          {METRICS.map((metric) => (
            <ThresholdEditor
              key={metric}
              metric={metric}
              settings={settings}
              dispatch={dispatch}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
