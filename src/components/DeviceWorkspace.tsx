import { useId, useState, type CSSProperties, type FormEvent } from "react";
import {
  ChevronDown,
  Maximize2,
  Minimize2,
  Monitor,
  RotateCcw,
  Save,
  SlidersHorizontal,
} from "lucide-react";
import {
  applyDeviceProperties,
  createDefaultDeviceLayout,
  defaultDeviceProperties,
  deviceRangeDescription,
  deviceScalePosition,
  resetDeviceSlot,
  type DeviceField,
  type DeviceProperties,
  type DeviceSlot,
  type DeviceSlotId,
} from "../engine/device";
import {
  displayUnit,
  formatTime,
  formatValue,
  metricInfo,
} from "../engine/model";
import {
  METRICS,
  type Metric,
  type Alert,
  type Diagnostics,
  type Settings,
  type Severity,
  type Telemetry,
} from "../engine/types";
import "../device-workspace.css";
import { DevicePreviewPages } from "./DevicePreviewPages";

export interface DeviceWorkspaceProps {
  /** Only the central pipeline's last accepted sample belongs here. */
  telemetry: Telemetry;
  settings: Settings;
  stale: boolean;
  running: boolean;
  severity: Record<Metric, Severity>;
  sampleStatus?: string;
  standby?: boolean;
  history: Telemetry[];
  diagnostics: Diagnostics;
  simulationTime: number;
  onAck: (key: Alert["key"]) => void;
}
interface Draft {
  metric: Metric;
  label: string;
  min: string;
  max: string;
}
function toDraft(properties: DeviceProperties): Draft {
  return {
    metric: properties.metric,
    label: properties.label,
    min: String(properties.min),
    max: String(properties.max),
  };
}
function point(angle: number, radius: number) {
  return {
    x: 110 + Math.cos((angle * Math.PI) / 180) * radius,
    y: 110 + Math.sin((angle * Math.PI) / 180) * radius,
  };
}
function arc(start: number, end: number, radius: number) {
  const a = point(start, radius),
    b = point(end, radius);
  return `M ${a.x} ${a.y} A ${radius} ${radius} 0 ${end - start > 180 ? 1 : 0} 1 ${b.x} ${b.y}`;
}
function DeviceInstrument({
  slot,
  selected,
  value,
  severity,
  stale,
  settings,
  onSelect,
  testIdPrefix = "device",
  featured = false,
  standby = false,
}: {
  slot: DeviceSlot;
  selected: boolean;
  value: number;
  severity: Severity;
  stale: boolean;
  settings: Settings;
  onSelect: () => void;
  testIdPrefix?: string;
  featured?: boolean;
  standby?: boolean;
}) {
  const fraction = standby ? 0 : deviceScalePosition(value, slot);
  const end = 145 + fraction * 250;
  const gradientId = useId().replaceAll(":", "");
  const rangeDescription = standby
    ? "Display scale inactive until simulation starts"
    : deviceRangeDescription(value, slot);
  const displayedValue = standby
    ? "0"
    : formatValue(slot.metric, value, settings.units);
  const reading = `${displayedValue} ${displayUnit(slot.metric, settings.units)}`;
  const condition = standby
    ? "Standby — start simulation"
    : stale
      ? "Stale accepted sample"
      : `${severity} condition`;
  return (
    <button
      type="button"
      className={`device-preview-slot ${featured ? "device-preview-primary" : "device-preview-band"} ${severity} ${standby ? "device-standby" : ""} ${stale ? "device-stale" : ""}`}
      aria-pressed={selected}
      aria-label={`Select slot ${slot.id}: ${slot.label}. ${reading}. ${condition}. ${rangeDescription}. Simulated data.`}
      data-testid={`${testIdPrefix}-slot-${slot.id}`}
      onClick={onSelect}
      style={
        {
          "--device-signal-color": metricInfo[slot.metric].color,
          "--device-level": `${fraction * 100}%`,
        } as CSSProperties
      }
    >
      <span className="device-slot-heading">
        <span>{slot.label}</span>
        <span className="mono">{String(slot.id).padStart(2, "0")}</span>
      </span>
      <div className="device-dial-content">
        {featured ? (
          <svg
            className="device-gauge"
            viewBox="0 0 220 220"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id={`${gradientId}-metal`}
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop offset="0" stopColor="#e8ecf1" />
                <stop offset=".18" stopColor="#636e7c" />
                <stop offset=".4" stopColor="#eff5fb" />
                <stop offset=".6" stopColor="#636e7c" />
                <stop offset=".82" stopColor="#b8c3cf" />
                <stop offset="1" stopColor="#414b58" />
              </linearGradient>
              <radialGradient
                id={`${gradientId}-face`}
                cx=".48"
                cy=".38"
                r=".7"
              >
                <stop offset="0" stopColor="#123362" />
                <stop offset=".65" stopColor="#06152c" />
                <stop offset="1" stopColor="#030810" />
              </radialGradient>
            </defs>
            <circle
              cx="110"
              cy="110"
              r="102"
              fill="#080b10"
              stroke="#303b49"
              strokeWidth="3"
            />
            <circle
              cx="110"
              cy="110"
              r="94"
              fill={`url(#${gradientId}-face)`}
              stroke={`url(#${gradientId}-metal)`}
              strokeWidth="10"
            />
            <circle
              cx="110"
              cy="110"
              r="86"
              fill="none"
              stroke="#12273f"
              strokeWidth="2"
            />
            <path
              d={arc(145, 395, 78)}
              fill="none"
              stroke="#1b3758"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {fraction > 0.002 && (
              <path
                d={arc(145, end, 78)}
                fill="none"
                stroke="#48c6ff"
                strokeWidth="4"
                strokeLinecap="round"
              />
            )}
            {Array.from({ length: 26 }, (_, tick) => {
              const a = point(145 + tick * 10, tick % 5 === 0 ? 66 : 70),
                b = point(145 + tick * 10, 74);
              return (
                <line
                  key={tick}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={tick % 5 === 0 ? "#ecf5ff" : "#89a5c6"}
                  strokeWidth={tick % 5 === 0 ? 1.7 : 1}
                />
              );
            })}
            <path
              d={arc(202, 310, 100)}
              fill="none"
              stroke="#ffffff"
              strokeWidth="1"
              opacity=".55"
            />
          </svg>
        ) : (
          <div className="device-band-meter" aria-hidden="true">
            {Array.from({ length: 16 }, (_, index) => (
              <span
                key={index}
                className={fraction >= (index + 1) / 16 ? "is-filled" : ""}
              />
            ))}
          </div>
        )}
        <span className="device-reading">
          <strong
            className="mono"
            data-testid={`${testIdPrefix}-value-${slot.id}`}
          >
            {displayedValue}
          </strong>
          <span>{displayUnit(slot.metric, settings.units)}</span>
        </span>
      </div>
      <span className="device-dial-scale">
        <span>{formatValue(slot.metric, slot.min, settings.units)}</span>
        <span>{formatValue(slot.metric, slot.max, settings.units)}</span>
      </span>
      <span className="device-slot-status">
        {standby
          ? "STANDBY — START SIMULATION"
          : stale
            ? "STALE SAMPLE"
            : severity === "normal"
              ? "NORMAL"
              : severity.toUpperCase()}
      </span>
      {!standby && rangeDescription !== "Within display scale" && (
        <span className="device-range-note">{rangeDescription}</span>
      )}
    </button>
  );
}

export function DeviceWorkspace({
  telemetry,
  settings,
  stale,
  running,
  severity,
  sampleStatus,
  standby = false,
  history,
  diagnostics,
  simulationTime,
  onAck,
}: DeviceWorkspaceProps) {
  const [layout, setLayout] = useState(createDefaultDeviceLayout);
  const [selectedId, setSelectedId] = useState<DeviceSlotId>(1);
  const [expandedPreview, setExpandedPreview] = useState(false);
  const selected = layout.slots.find((slot) => slot.id === selectedId)!;
  const [draft, setDraft] = useState<Draft>(() => toDraft(selected));
  const [feedback, setFeedback] = useState<{
    message: string;
    field?: DeviceField;
  }>({ message: "" });
  const prefix = useId();
  const feedbackId = `${prefix}-feedback`;
  const info = metricInfo[draft.metric];
  const dirty =
    draft.metric !== selected.metric ||
    draft.label !== selected.label ||
    draft.min !== String(selected.min) ||
    draft.max !== String(selected.max);
  const status = standby
    ? "Standby — start simulation"
    : sampleStatus === "rejected"
      ? stale
        ? "Rejected delivery · stale accepted sample"
        : "Sample rejected · last valid readings retained"
      : stale
        ? "Stale accepted sample"
        : running
          ? "Receiving accepted samples"
          : "Simulation paused";
  function selectSlot(slot: DeviceSlot) {
    setSelectedId(slot.id);
    setDraft(toDraft(slot));
    setFeedback({ message: "" });
  }
  function inspectMetric(metric: Metric) {
    const slot = layout.slots.find((item) => item.metric === metric);
    if (slot) selectSlot(slot);
    else {
      setDraft(toDraft(defaultDeviceProperties(metric)));
      setFeedback({
        message: `Signal selected for slot ${selectedId}. Apply to change its display binding.`,
      });
    }
  }
  function bindSignal(metric: Metric) {
    if (draft.metric === metric) return;
    setDraft(toDraft(defaultDeviceProperties(metric)));
    setFeedback({ message: "" });
  }
  function edit(field: "label" | "min" | "max", value: string) {
    setDraft({ ...draft, [field]: value });
    setFeedback({ message: "" });
  }
  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = applyDeviceProperties(layout, selectedId, {
      metric: draft.metric,
      label: draft.label,
      min: draft.min.trim() ? Number(draft.min) : NaN,
      max: draft.max.trim() ? Number(draft.max) : NaN,
    });
    if (!result.ok) {
      setFeedback({ message: result.error, field: result.field });
      return;
    }
    setLayout(result.layout);
    setDraft(
      toDraft(result.layout.slots.find((slot) => slot.id === selectedId)!),
    );
    setFeedback({
      message: `Slot ${selectedId} properties applied. Telemetry and diagnostic thresholds are unchanged.`,
    });
  }
  function reset() {
    const result = resetDeviceSlot(layout, selectedId);
    if (!result.ok) {
      setFeedback({ message: result.error, field: result.field });
      return;
    }
    setLayout(result.layout);
    setDraft(
      toDraft(result.layout.slots.find((slot) => slot.id === selectedId)!),
    );
    setFeedback({
      message: `Slot ${selectedId} restored to its default display properties.`,
    });
  }
  const invalid = (field: DeviceField) =>
    feedback.field === field ||
    (feedback.field === "range" && (field === "min" || field === "max"));
  return (
    <details className="panel device-workspace" data-testid="device-workspace">
      <summary>
        <span className="device-summary-title">
          <Monitor size={18} aria-hidden="true" />
          <span>
            <strong>Device workspace</strong>
            <small>
              Preview instruments, bind signals, and edit display properties.
            </small>
          </span>
        </span>
        <ChevronDown
          className="device-summary-arrow"
          size={18}
          aria-hidden="true"
        />
      </summary>
      <div className="device-workspace-content">
        <p className="device-workspace-note">
          Session-only layout · six fixed slots · display edits do not alter the
          simulator or alerts. Changes appear after Apply.
        </p>
        <div
          className={`device-workspace-grid ${expandedPreview ? "device-preview-expanded" : ""}`}
        >
          <section
            className="device-signals"
            aria-labelledby={`${prefix}-signals`}
          >
            <h3 id={`${prefix}-signals`}>Signal browser</h3>
            <p>Choose a signal for slot {selectedId}.</p>
            <div className="device-signal-list">
              {METRICS.map((metric) => (
                <button
                  type="button"
                  key={metric}
                  aria-label={`Bind ${metricInfo[metric].label} to selected slot`}
                  aria-pressed={draft.metric === metric}
                  className="device-signal-button"
                  onClick={() => bindSignal(metric)}
                >
                  <span>
                    <strong>{metricInfo[metric].label}</strong>
                    <small className="mono">{metric}</small>
                  </span>
                  <span className="device-signal-value">
                    <span className="mono">
                      {standby
                        ? "0"
                        : formatValue(
                            metric,
                            telemetry[metric],
                            settings.units,
                          )}{" "}
                      {displayUnit(metric, settings.units)}
                    </span>
                    <small
                      className={
                        standby
                          ? "muted"
                          : stale
                            ? "critical"
                            : severity[metric]
                      }
                    >
                      {standby ? "Standby" : stale ? "Stale" : severity[metric]}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          </section>
          <section
            className="device-preview"
            aria-labelledby={`${prefix}-preview`}
          >
            <div className="device-panel-heading">
              <h3 id={`${prefix}-preview`}>Device preview</h3>
              <button
                className="device-preview-size"
                type="button"
                onClick={() => setExpandedPreview(!expandedPreview)}
                aria-pressed={expandedPreview}
                aria-label={
                  expandedPreview
                    ? "Restore preview size"
                    : "Expand device preview"
                }
              >
                {expandedPreview ? (
                  <Minimize2 size={14} aria-hidden="true" />
                ) : (
                  <Maximize2 size={14} aria-hidden="true" />
                )}
                {expandedPreview ? "Restore size" : "Expand preview"}
              </button>
            </div>
            <p>Select an instrument to edit its slot.</p>
            <div className="device-bezel">
              <div className="device-bezel-heading">
                <span>COBALT DISPLAY</span>
                <span>SIMULATED</span>
              </div>
              <DevicePreviewPages
                telemetry={telemetry}
                standby={standby}
                history={history}
                diagnostics={diagnostics}
                settings={settings}
                stale={stale}
                running={running}
                simulationTime={simulationTime}
                onAck={onAck}
                onInspectMetric={inspectMetric}
                gauges={
                  <div className="device-slot-grid">
                    {layout.slots.map((slot) => (
                      <DeviceInstrument
                        key={slot.id}
                        slot={slot}
                        featured={slot.id === 1}
                        standby={standby}
                        selected={slot.id === selectedId}
                        value={telemetry[slot.metric]}
                        severity={severity[slot.metric]}
                        stale={stale}
                        settings={settings}
                        onSelect={() => selectSlot(slot)}
                      />
                    ))}
                  </div>
                }
                engineGauge={
                  <DeviceInstrument
                    featured
                    standby={standby}
                    slot={
                      layout.slots.find((slot) => slot.metric === "rpm") || {
                        ...defaultDeviceProperties("rpm"),
                        id: selectedId,
                      }
                    }
                    selected={selected.metric === "rpm"}
                    value={telemetry.rpm}
                    severity={severity.rpm}
                    stale={stale}
                    settings={settings}
                    testIdPrefix="device-engine"
                    onSelect={() => inspectMetric("rpm")}
                  />
                }
              />
              <div
                className={`device-preview-status ${stale ? "critical" : "muted"}`}
                data-testid="device-preview-status"
              >
                <span>{status}</span>
                <span className="mono">
                  {standby
                    ? "Awaiting start"
                    : `Accepted ${formatTime(telemetry.time)}`}
                </span>
              </div>
            </div>
            {sampleStatus && (
              <p className="device-sample-note">
                {sampleStatus === "rejected"
                  ? "Rejected deliveries cannot change the preview. It shows the last accepted sample."
                  : sampleStatus === "recovered"
                    ? "Valid sample delivery recovered; the preview follows accepted readings."
                    : standby
                      ? "Standby — start simulation. Display readouts are zero until the session starts; the central accepted sample remains intact."
                      : "Preview and signal browser share the central accepted sample."}
              </p>
            )}
          </section>
          <section
            className="device-properties"
            aria-labelledby={`${prefix}-properties`}
          >
            <h3 id={`${prefix}-properties`}>
              <SlidersHorizontal size={15} aria-hidden="true" /> Slot{" "}
              {selectedId} properties
            </h3>
            <p>Edits affect this preview slot only.</p>
            <form onSubmit={apply} noValidate>
              <label htmlFor={`${prefix}-metric`}>Bound signal</label>
              <select
                id={`${prefix}-metric`}
                value={draft.metric}
                onChange={(event) => bindSignal(event.target.value as Metric)}
                aria-invalid={invalid("metric")}
                aria-describedby={feedback.field ? feedbackId : undefined}
              >
                {METRICS.map((metric) => (
                  <option key={metric} value={metric}>
                    {metricInfo[metric].label}
                  </option>
                ))}
              </select>
              <label htmlFor={`${prefix}-label`}>Display label</label>
              <input
                id={`${prefix}-label`}
                type="text"
                value={draft.label}
                maxLength={32}
                onChange={(event) => edit("label", event.target.value)}
                aria-invalid={invalid("label")}
                aria-describedby={
                  feedback.field ? feedbackId : `${prefix}-label-help`
                }
              />
              <small id={`${prefix}-label-help`}>1–32 characters</small>
              <div className="device-scale-fields">
                <label htmlFor={`${prefix}-min`}>
                  Scale minimum ({info.unit})
                  <input
                    id={`${prefix}-min`}
                    type="number"
                    step="any"
                    value={draft.min}
                    onChange={(event) => edit("min", event.target.value)}
                    aria-invalid={invalid("min")}
                    aria-describedby={`${prefix}-scale-help${feedback.field ? ` ${feedbackId}` : ""}`}
                  />
                </label>
                <label htmlFor={`${prefix}-max`}>
                  Scale maximum ({info.unit})
                  <input
                    id={`${prefix}-max`}
                    type="number"
                    step="any"
                    value={draft.max}
                    onChange={(event) => edit("max", event.target.value)}
                    aria-invalid={invalid("max")}
                    aria-describedby={`${prefix}-scale-help${feedback.field ? ` ${feedbackId}` : ""}`}
                  />
                </label>
              </div>
              <small id={`${prefix}-scale-help`} className="device-scale-help">
                Canonical range: {info.min}–{info.max} {info.unit}. Readings and
                ticks use your selected display units.
              </small>
              <div className="device-property-actions">
                <button className="button primary" type="submit">
                  <Save size={14} aria-hidden="true" />
                  Apply properties
                </button>
                <button
                  className="button secondary"
                  type="button"
                  onClick={reset}
                  aria-label={`Reset slot ${selectedId} properties`}
                >
                  <RotateCcw size={14} aria-hidden="true" />
                  Reset slot
                </button>
              </div>
              <p className="device-draft-state">
                {dirty
                  ? "Unapplied changes. Apply to update the preview."
                  : "Preview matches applied properties."}
              </p>
              <p
                id={feedbackId}
                className={`device-property-feedback ${feedback.field ? "critical" : "normal"}`}
                role={feedback.field ? "alert" : "status"}
                aria-live={feedback.field ? "assertive" : "polite"}
                aria-atomic="true"
              >
                {feedback.message}
              </p>
            </form>
          </section>
        </div>
      </div>
    </details>
  );
}
