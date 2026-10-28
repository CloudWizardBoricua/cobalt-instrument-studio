/**
 * Derive process alerts, communication quality, and bounded event evidence from
 * accepted simulation state. studio-state.ts calls this after each running tick;
 * settings.ts supplies validated thresholds and instruments.ts supplies labels.
 * UI components display this shared diagnostic state rather than evaluating
 * their own independent alarms.
 *
 * HMI concepts demonstrated here are hysteresis, sample debounce, stale-data
 * detection, escalation, acknowledgment, and recovery. They are browser-local
 * advisory behavior. There is no hardware interlock, safety-rated shutdown,
 * operator authentication, persistent event journal, or alarm-system validation.
 */
import { EVENT_CAPACITY, metricInfo } from "./instruments";
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

// One alert per signal plus a communication alert. Processing markers prevent
// duplicate sample/notice handling; IDs increase within the current session.
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
    lastProcessedSampleTimestamp: null,
    lastDeliveryAttemptAt: null,
  };
}
/** Append immutable session evidence and discard the oldest entries at capacity. */
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
/**
 * Use inclusive trigger boundaries and a separate recovery margin to avoid
 * chatter near a threshold. Current severity matters: a critical condition
 * remains critical at its recovery boundary until it moves beyond that margin.
 * This classifies one value; updateDiagnostics applies sample debounce.
 */
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
/**
 * Consume delivery notices, compute sample age, then evaluate shared alerts.
 * Process debounce advances only for a distinct fresh accepted timestamp.
 * Communication loss follows age immediately, so a frozen or rejected reading
 * cannot appear healthy merely because its retained process value is normal.
 */
export function updateDiagnostics(
  previous: Diagnostics,
  simulation: Simulation,
  settings: Settings,
): Diagnostics {
  let d: Diagnostics = { ...previous, alerts: { ...previous.alerts } };
  // A notice describes delivery quality, not necessarily a process fault.
  // Its attempt marker keeps duplicate calls from repeating the same evidence.
  if (simulation.delivery.lastAttemptAt !== previous.lastDeliveryAttemptAt) {
    for (const notice of simulation.delivery.notices) {
      d = addEvent(
        d,
        simulation.time,
        notice.message,
        notice.kind === "validation" ? "warning" : "normal",
        notice.kind,
      );
    }
    d.lastDeliveryAttemptAt = simulation.delivery.lastAttemptAt;
  }
  const age = simulation.time - simulation.receivedAt;
  const stale = age >= settings.timeoutSeconds;
  const newSample =
    previous.lastProcessedSampleTimestamp === null ||
    simulation.received.time > previous.lastProcessedSampleTimestamp;
  for (const key of [...METRICS, "communication"] as const) {
    const old = previous.alerts[key];
    // Hold existing process conditions on stale/duplicate data. Clearing them
    // would imply evidence of recovery that the HMI has not actually received.
    if (key !== "communication" && (stale || !newSample)) continue;
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
    // Debounce counts received samples, not render cycles or wall-clock time.
    // Communication uses one evaluation when the configured age limit is met.
    const debounce = key === "communication" ? 1 : settings.debounceSamples;
    if (desired !== old.severity && alert.candidateSamples >= debounce) {
      alert.severity = desired;
      alert.since = simulation.time;
      // Every severity transition requires a new review, including escalation
      // after acknowledgment. Returning to normal records recovery separately.
      alert.acknowledged = false;
      const name =
        key === "communication" ? "Communication" : metricInfo[key].label;
      if (desired === "normal") {
        alert.reason =
          key === "communication"
            ? "Fresh valid sample delivery resumed."
            : "Value returned beyond the recovery threshold.";
      } else if (key === "communication") {
        alert.reason = `No valid sample for ${age.toFixed(1)} s; timeout is ${settings.timeoutSeconds} s.`;
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
  d.lastProcessedSampleTimestamp = simulation.received.time;
  return d;
}
/**
 * Record one review of an active condition without changing its severity.
 * Repeated acknowledgments and normal channels are no-ops. A real deployment
 * would need operator identity and durable audit requirements outside this demo.
 */
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
// Acknowledged alerts remain active until accepted data supports recovery.
export function activeAlerts(d: Diagnostics) {
  return Object.values(d.alerts).filter((a) => a.severity !== "normal");
}
