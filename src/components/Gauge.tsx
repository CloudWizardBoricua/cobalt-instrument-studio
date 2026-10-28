/**
 * Reusable dashboard SVG instrument for one accepted simulated metric.
 * Catalog metadata supplies scales, units and color; diagnostic severity and quality arrive
 * from App. Display-unit conversion never mutates canonical telemetry or threshold settings.
 * Standby zero is a presentation placeholder, not a sample. Clamp only needle geometry while
 * retaining the numeric value; explicit stale/rejected/paused text supplements color cues.
 * This is a browser visualization, not a calibrated physical gauge or equipment interlock.
 */
import {
  displayUnit,
  displayValue,
  formatValue,
  metricInfo,
} from "../engine/instruments";
import type { Metric, Severity, Settings } from "../engine/types";

// Shared polar geometry builds the dial arc, tick marks and needle in SVG coordinates.
function point(angle: number, radius: number) {
  return {
    x: 110 + Math.cos((angle * Math.PI) / 180) * radius,
    y: 108 + Math.sin((angle * Math.PI) / 180) * radius,
  };
}
function arc(start: number, end: number, radius: number) {
  const a = point(start, radius),
    b = point(end, radius);
  return `M ${a.x} ${a.y} A ${radius} ${radius} 0 ${end - start > 180 ? 1 : 0} 1 ${b.x} ${b.y}`;
}
// Props separate process severity from sample freshness and presentation lifecycle.
export function Gauge({
  metric,
  value,
  severity,
  stale,
  settings,
  paused = false,
  rejected = false,
  standby = false,
}: {
  metric: Metric;
  value: number;
  severity: Severity;
  stale: boolean;
  settings: Settings;
  paused?: boolean;
  rejected?: boolean;
  standby?: boolean;
}) {
  const info = metricInfo[metric];
// Standby hides the accepted startup sample; running geometry clamps to the display scale.
  const fraction = standby ? 0 : Math.max(
    0,
    Math.min(1, (value - info.min) / (info.max - info.min)),
  );
  const end = 145 + fraction * 250;
  const needle = point(end, 61);
  const color =
    severity === "critical"
      ? "var(--critical)"
      : severity === "warning"
        ? "var(--warning)"
        : info.color;
  const reading = standby ? "0" : formatValue(metric, value, settings.units);
// Accessible text includes numeric units and quality; the decorative SVG is hidden from AT.
  const label = `${info.label}: ${reading} ${displayUnit(metric, settings.units)}. ${standby ? "Standby; start the simulation to receive readings" : `${severity} condition`}. ${stale ? "Stale sample. " : ""}${rejected ? "Rejected delivery; last valid value retained. " : ""}${paused && !standby ? "Simulation paused. " : ""}Simulated data.`;
  return (
    <article
      className={`gauge-card panel ${stale ? "is-stale" : ""}`}
      aria-label={label}
      data-testid={`gauge-${metric}`}
    >
      <div className="gauge-heading">
        <h3>{info.label}</h3>
        <span
          className={`status-dot ${stale ? "critical" : severity}`}
          aria-hidden="true"
        />
      </div>
      <svg className="gauge-svg" viewBox="0 0 220 170" aria-hidden="true">
        <path
          d={arc(145, 395, 77)}
          fill="none"
          stroke="var(--gauge-track)"
          strokeWidth="9"
          strokeLinecap="round"
        />
        {fraction > 0.002 && (
          <path
            d={arc(145, end, 77)}
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeLinecap="round"
          />
        )}
        {Array.from({ length: 21 }, (_, i) => {
          const a = point(145 + i * 12.5, i % 5 === 0 ? 61 : 65),
            b = point(145 + i * 12.5, 69);
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="var(--muted)"
              opacity={i % 5 === 0 ? 0.8 : 0.4}
              strokeWidth={i % 5 === 0 ? 1.5 : 1}
            />
          );
        })}
        <line
          x1="110"
          y1="108"
          x2={needle.x}
          y2={needle.y}
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle
          cx="110"
          cy="108"
          r="6"
          fill="var(--panel)"
          stroke={color}
          strokeWidth="2"
        />
        <text x="29" y="153" fill="var(--muted)" fontSize="10">
          {Math.round(displayValue(metric, info.min, settings.units))}
        </text>
        <text
          x="191"
          y="153"
          fill="var(--muted)"
          fontSize="10"
          textAnchor="end"
        >
          {Math.round(displayValue(metric, info.max, settings.units))}
        </text>
      </svg>
      <div className="gauge-reading">
        <strong data-testid={`value-${metric}`}>
          {reading}
        </strong>
        <span>{displayUnit(metric, settings.units)}</span>
      </div>
      <div className={`gauge-foot ${stale ? "critical" : severity}`}>
        <span>
          {standby
            ? "STANDBY"
            : stale
            ? "STALE SAMPLE"
            : severity === "normal"
              ? "WITHIN LIMITS"
              : `${severity.toUpperCase()} CONDITION`}
        </span>
        <span className="mono">
          {metric === "rpm"
            ? "CH 01"
            : `CH 0${["oilPressure", "coolantTemp", "batteryVoltage", "fuelLevel", "engineLoad"].indexOf(metric) + 2}`}
        </span>
      </div>
    </article>
  );
}
