/**
 * Five operator-style pages inside the browser device preview.
 * Gauges and Engine present accepted telemetry; Trends reuses bounded history; Faults and
 * ACK share the central diagnostic state. Page selection is local and equipment-independent.
 * Tabs and softkeys address the same page, with roving tab focus and arrow/Home/End support.
 * ACK forwards review to the parent; it cannot clear a continuing condition or control a
 * physical device. Event excerpts are session records, not live protocol fault codes or
 * durable authenticated industrial acknowledgments.
 */
import {
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  Activity,
  ChartNoAxesCombined,
  Check,
  CircleGauge,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { activeAlerts } from "../engine/diagnostics";
import {
  displayUnit,
  formatTime,
  formatValue,
  metricInfo,
} from "../engine/instruments";
import type {
  Alert,
  Diagnostics,
  Metric,
  Settings,
  Telemetry,
} from "../engine/types";
import { TrendChart } from "./TrendChart";
import "../styles/device-preview-pages.css";

// Single page catalog drives tab labels, IDs and softkey navigation consistently.
const pages = [
  { key: "gauges", label: "Gauges", icon: CircleGauge },
  { key: "engine", label: "Engine", icon: Activity },
  { key: "trends", label: "Trends", icon: ChartNoAxesCombined },
  { key: "faults", label: "Faults", icon: TriangleAlert },
  { key: "ack", label: "ACK", icon: Check },
] as const;
type Page = (typeof pages)[number]["key"];
const engineMetrics: Metric[] = [
  "engineLoad",
  "fuelLevel",
  "coolantTemp",
  "oilPressure",
  "batteryVoltage",
];
const trendMetrics: Metric[] = ["rpm", "coolantTemp", "oilPressure"];
const alertName = (key: Alert["key"]) =>
  key === "communication" ? "Communication loss" : metricInfo[key].label;

// Accepted values and diagnostic callbacks enter through one source-owned contract.
export interface DevicePreviewPagesProps {
  gauges: ReactNode;
  engineGauge: ReactNode;
  telemetry: Telemetry;
  history: Telemetry[];
  diagnostics: Diagnostics;
  settings: Settings;
  stale: boolean;
  running: boolean;
  standby?: boolean;
  simulationTime: number;
  onInspectMetric: (metric: Metric) => void;
  onAck: (key: Alert["key"]) => void;
}

export function DevicePreviewPages({
  gauges,
  engineGauge,
  telemetry,
  history,
  diagnostics,
  settings,
  stale,
  running,
  standby = false,
  simulationTime,
  onInspectMetric,
  onAck,
}: DevicePreviewPagesProps) {
// Keep page/focus presentation state separate from telemetry and alarm review state.
  const [page, setPage] = useState<Page>("gauges");
  const prefix = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const alerts = activeAlerts(diagnostics);
  const unreviewed = alerts.filter((alert) => !alert.acknowledged);
  const cleared = [...diagnostics.events]
    .reverse()
    .filter(
      (event) => event.kind === "transition" && event.severity === "normal",
    )
    .slice(0, 8);
  const acknowledgmentEvents = [...diagnostics.events]
    .reverse()
    .filter((event) => event.kind === "acknowledgment")
    .slice(0, 5);
// Roving keyboard navigation selects and focuses one tab while preserving the accepted sample.
  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const target =
      event.key === "ArrowRight"
        ? (index + 1) % pages.length
        : event.key === "ArrowLeft"
          ? (index + pages.length - 1) % pages.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? pages.length - 1
              : null;
    if (target === null) return;
    event.preventDefault();
    setPage(pages[target].key);
    tabRefs.current[target]?.focus();
  }
  return (
    <div className="device-preview-pages">
      <div className="device-display-screen">
        <header className="device-screen-header">
          <strong>
            {pages.find((item) => item.key === page)!.label === "ACK"
              ? "Alert review"
              : pages.find((item) => item.key === page)!.label}
          </strong>
          <div>
            <span
              className={
                alerts.some((alert) => alert.severity === "critical")
                  ? "critical"
                  : alerts.length
                    ? "warning"
                    : "normal"
              }
            >
              {alerts.length ? (
                <TriangleAlert size={13} aria-hidden="true" />
              ) : (
                <ShieldCheck size={13} aria-hidden="true" />
              )}
              {alerts.length} active
            </span>
            <span className="mono">SIM {formatTime(simulationTime)}</span>
          </div>
        </header>
{/* ARIA tab controls and associated panels remain paired through unique per-instance IDs. */}
        <div
          className="device-page-tabs"
          role="tablist"
          aria-label="Device preview pages"
        >
          {pages.map((item, index) => (
            <button
              type="button"
              key={item.key}
              id={`${prefix}-tab-${item.key}`}
              role="tab"
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              aria-selected={page === item.key}
              aria-controls={`${prefix}-panel-${item.key}`}
              tabIndex={page === item.key ? 0 : -1}
              onClick={() => setPage(item.key)}
              onKeyDown={(event) => navigate(event, index)}
            >
              {item.label}
{/* Reviewing an alert does not clear it; escalation requires renewed review centrally. */}
              {item.key === "ack" && unreviewed.length > 0 && (
                <span className="device-tab-count">{unreviewed.length}</span>
              )}
            </button>
          ))}
        </div>
        <div className="device-pages-body">
          {pages.map((item) => (
            <div
              key={item.key}
              role="tabpanel"
              id={`${prefix}-panel-${item.key}`}
              aria-labelledby={`${prefix}-tab-${item.key}`}
              tabIndex={0}
              hidden={page !== item.key}
              className={`device-page device-page-${item.key}`}
              data-testid={`device-page-${item.key}`}
            >
              {item.key === "gauges" && page === "gauges" && gauges}
{/* Engine cards convert units and clip decorative levels only; displayed readings retain their value. */}
              {item.key === "engine" && page === "engine" && (
                <div className="device-engine-layout">
                  <div className="device-engine-rpm">{engineGauge}</div>
                  <div className="device-engine-cards">
                    {engineMetrics.map((metric) => {
                      const info = metricInfo[metric];
                      const level = standby
                        ? 0
                        : Math.max(
                            0,
                            Math.min(
                              100,
                              ((telemetry[metric] - info.min) /
                                (info.max - info.min)) *
                                100,
                            ),
                          );
                      const condition = diagnostics.alerts[metric].severity;
                      return (
                        <button
                          type="button"
                          key={metric}
                          className={`device-engine-card ${condition} ${standby ? "device-standby" : ""}`}
                          aria-label={`Inspect ${info.label} display properties. ${standby ? "0" : formatValue(metric, telemetry[metric], settings.units)} ${displayUnit(metric, settings.units)}. ${standby ? "Standby — start simulation" : stale ? "Stale accepted sample" : `${condition} condition`}. Simulated data.`}
                          onClick={() => onInspectMetric(metric)}
                        >
                          <span className="device-engine-label">
                            {info.label}
                          </span>
                          <span className="device-engine-reading">
                            <strong
                              className="mono"
                              data-testid={`device-engine-value-${metric}`}
                            >
                              {standby
                                ? "0"
                                : formatValue(
                                    metric,
                                    telemetry[metric],
                                    settings.units,
                                  )}
                            </strong>
                            <small>{displayUnit(metric, settings.units)}</small>
                          </span>
                          <span
                            className="device-engine-level"
                            aria-hidden="true"
                          >
                            <span style={{ width: `${level}%` }} />
                          </span>
                          <span className="device-engine-condition">
                            {standby
                              ? "Standby — start simulation"
                              : stale
                                ? "Stale sample"
                                : condition}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
{/* TrendChart preserves explicit gaps in accepted history rather than drawing through loss. */}
              {item.key === "trends" && page === "trends" && (
                <div className="device-trend-stack">
                  {trendMetrics.map((metric) => (
                    <section
                      className="device-trend-row"
                      key={metric}
                      aria-label={`${metricInfo[metric].label} accepted history`}
                    >
                      <div className="device-trend-reading">
                        <strong>{metricInfo[metric].label}</strong>
                        <span className="mono">
                          {standby
                            ? "0"
                            : formatValue(
                                metric,
                                telemetry[metric],
                                settings.units,
                              )}{" "}
                          <small>{displayUnit(metric, settings.units)}</small>
                        </span>
                        <small>
                          {standby
                            ? "Standby — start simulation"
                            : stale
                              ? "Stale accepted reading"
                              : !running
                                ? "Paused or ready"
                                : "Accepted sample"}
                        </small>
                      </div>
                      <TrendChart
                        history={history}
                        metric={metric}
                        settings={settings}
                      />
                    </section>
                  ))}
                  <p className="device-page-note">
                    {standby
                      ? "Standby — start simulation to capture accepted history."
                      : `${history.length} accepted samples · gaps show missing or rejected deliveries · charts retain at most 240 samples.`}
                  </p>
                </div>
              )}
{/* Active conditions and recent clearing transitions describe the central simulator alarm state. */}
              {item.key === "faults" && page === "faults" && (
                <div className="device-fault-page">
                  <div className="device-fault-heading">
                    <h4>Active conditions</h4>
                    <span>{alerts.length} active</span>
                  </div>
                  {!alerts.length ? (
                    <div className="device-clear-state">
                      <ShieldCheck size={22} aria-hidden="true" />
                      <strong>No active conditions</strong>
                      <p>
                        Run a fault scenario to inspect warning, critical, and
                        recovery states.
                      </p>
                    </div>
                  ) : (
                    <div className="device-fault-list">
                      {alerts.map((alert) => (
                        <article
                          className={`device-fault-row ${alert.severity}`}
                          key={alert.key}
                          data-testid={`device-fault-${alert.key}`}
                        >
                          <TriangleAlert size={16} aria-hidden="true" />
                          <div>
                            <strong>{alertName(alert.key)}</strong>
                            <p>{alert.reason}</p>
                            <small>
                              Since {formatTime(alert.since)} ·{" "}
                              {alert.acknowledged
                                ? "Acknowledged"
                                : "Needs review"}
                            </small>
                          </div>
                          <span className={`severity-tag ${alert.severity}`}>
                            {alert.severity}
                          </span>
                        </article>
                      ))}
                    </div>
                  )}
                  <div className="device-fault-heading">
                    <h4>Previously cleared</h4>
                    <span>{cleared.length} shown</span>
                  </div>
                  {!cleared.length ? (
                    <p className="device-page-note">
                      No clearing transitions recorded in this session.
                    </p>
                  ) : (
                    <ol className="device-previous-list">
                      {cleared.map((event) => (
                        <li key={event.id}>
                          <Check size={14} aria-hidden="true" />
                          <p>{event.message}</p>
                          <time className="mono">{formatTime(event.time)}</time>
                        </li>
                      ))}
                    </ol>
                  )}
                  <p className="device-page-note">
                    Recorded simulator conditions. No live equipment or protocol
                    fault codes are provided.
                  </p>
                </div>
              )}
              {item.key === "ack" && page === "ack" && (
                <div className="device-ack-page">
                  <div className="device-fault-heading">
                    <h4>Review active alerts</h4>
                    <span>{unreviewed.length} need review</span>
                  </div>
                  <p className="device-page-note">
                    Acknowledgment records review. The condition remains active
                    until recovery; escalation requires a new review.
                  </p>
                  {!alerts.length ? (
                    <div className="device-clear-state">
                      <ShieldCheck size={24} aria-hidden="true" />
                      <strong>No alerts to review</strong>
                      <p>Warnings and critical conditions will appear here.</p>
                    </div>
                  ) : (
                    <div className="device-ack-list">
                      {alerts.map((alert) => (
                        <article
                          className={`device-ack-row ${alert.severity}`}
                          key={alert.key}
                        >
                          <div>
                            <strong>{alertName(alert.key)}</strong>
                            <p>
                              {alert.severity} · since {formatTime(alert.since)}
                            </p>
                            <small>{alert.reason}</small>
                          </div>
                          <button
                            type="button"
                            className="button secondary"
                            disabled={alert.acknowledged}
                            aria-label={`Review ${alertName(alert.key)} in device preview`}
                            onClick={() => onAck(alert.key)}
                          >
                            <Check size={14} aria-hidden="true" />
                            {alert.acknowledged ? "Reviewed" : "Record review"}
                          </button>
                        </article>
                      ))}
                    </div>
                  )}
                  {!!acknowledgmentEvents.length && (
                    <>
                      <h4 className="device-review-history-heading">
                        Recent reviews
                      </h4>
                      <ol className="device-previous-list">
                        {acknowledgmentEvents.map((event) => (
                          <li key={event.id}>
                            <Check size={14} aria-hidden="true" />
                            <p>{event.message}</p>
                            <time className="mono">
                              {formatTime(event.time)}
                            </time>
                          </li>
                        ))}
                      </ol>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
{/* Physical-style softkeys mirror page tabs and expose selection without relying on icons alone. */}
      <div className="device-softkeys" aria-label="Display softkeys">
        {pages.map((item) => {
          const Icon = item.icon;
          return (
            <button
              type="button"
              key={item.key}
              aria-label={`Softkey: open ${item.label === "ACK" ? "alert review" : item.label} page`}
              aria-pressed={page === item.key}
              onClick={() => setPage(item.key)}
            >
              <Icon size={16} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
