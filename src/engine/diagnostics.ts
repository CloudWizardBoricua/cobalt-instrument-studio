import { EVENT_CAPACITY, metricInfo } from "./model";
import {
  METRICS,
  type Alert,
  type Diagnostics,
  type EventRecord,
  type Settings,
  type Severity,
  type Simulation,
  type Threshold,
} from "./types";

export function createDiagnostics(): Diagnostics {
  return {
    alerts: Object.fromEntries(
      [...METRICS, "communication"].map((key) => [
        key,
        {
          key,
          severity: "normal",
          since: 0,
          acknowledged: false,
          reason: "",
          candidate: "normal",
          candidateSamples: 0,
        },
      ]),
    ) as Diagnostics["alerts"],
    events: [],
    nextId: 1,
  };
}
export function addEvent(
  diagnostics: Diagnostics,
  time: number,
  message: string,
  severity: Severity = "normal",
  kind: EventRecord["kind"] = "operator",
): Diagnostics {
  return {
    ...diagnostics,
    nextId: diagnostics.nextId + 1,
    events: [
      ...diagnostics.events,
      { id: diagnostics.nextId, time, message, severity, kind },
    ].slice(-EVENT_CAPACITY),
  };
}
export function classify(
  value: number,
  rule: Threshold,
  current: Severity,
): Severity {
  const beyond = (boundary: number) =>
    rule.direction === "above" ? value >= boundary : value <= boundary;
  const recovery = (boundary: number) =>
    boundary +
    (rule.direction === "above" ? -rule.hysteresis : rule.hysteresis);
  if (
    beyond(rule.critical) ||
    (current === "critical" && beyond(recovery(rule.critical)))
  )
    return "critical";
  if (
    beyond(rule.warning) ||
    (current !== "normal" && beyond(recovery(rule.warning)))
  )
    return "warning";
  return "normal";
}
export function updateDiagnostics(
  previous: Diagnostics,
  simulation: Simulation,
  settings: Settings,
): Diagnostics {
  let d: Diagnostics = { ...previous, alerts: { ...previous.alerts } };
  const age = simulation.time - simulation.receivedAt;
  const stale = age >= settings.timeoutSeconds;
  for (const key of [...METRICS, "communication"] as const) {
    const old = previous.alerts[key];
    if (key !== "communication" && (stale || age > 0)) continue;
    const value = key === "communication" ? age : simulation.received[key];
    const desired: Severity =
      key === "communication"
        ? stale
          ? "critical"
          : "normal"
        : classify(value, settings.thresholds[key], old.severity);
    const alert: Alert = {
      ...old,
      candidate: desired,
      candidateSamples:
        old.candidate === desired ? old.candidateSamples + 1 : 1,
    };
    const debounce = key === "communication" ? 1 : settings.debounceSamples;
    if (desired !== old.severity && alert.candidateSamples >= debounce) {
      alert.severity = desired;
      alert.since = simulation.time;
      alert.acknowledged = false;
      const name =
        key === "communication" ? "Communication" : metricInfo[key].label;
      if (desired === "normal") {
        alert.reason =
          key === "communication"
            ? "Sample delivery resumed."
            : "Value returned beyond the recovery threshold.";
      } else if (key === "communication") {
        alert.reason = `No new sample for ${age.toFixed(1)} s; timeout is ${settings.timeoutSeconds} s.`;
      } else {
        const rule = settings.thresholds[key];
        const threshold = desired === "critical" ? rule.critical : rule.warning;
        alert.reason = `${value.toFixed(key === "batteryVoltage" ? 2 : 1)} ${metricInfo[key].unit} is ${rule.direction} ${threshold} ${metricInfo[key].unit}.`;
      }
      d = addEvent(
        d,
        simulation.time,
        `${name}: ${old.severity} → ${desired}. ${alert.reason}`,
        desired,
        "transition",
      );
    }
    alert.candidateSamples = Math.min(
      alert.candidateSamples,
      settings.debounceSamples + 1,
    );
    d.alerts[key] = alert;
  }
  return d;
}
export function acknowledge(
  d: Diagnostics,
  key: Alert["key"],
  time: number,
): Diagnostics {
  const old = d.alerts[key];
  if (old.severity === "normal" || old.acknowledged) return d;
  const name =
    key === "communication" ? "Communication" : metricInfo[key].label;
  return addEvent(
    { ...d, alerts: { ...d.alerts, [key]: { ...old, acknowledged: true } } },
    time,
    `${name} ${old.severity} alert acknowledged. Condition remains active.`,
    old.severity,
    "acknowledgment",
  );
}
export function activeAlerts(d: Diagnostics) {
  return Object.values(d.alerts).filter((a) => a.severity !== "normal");
}
