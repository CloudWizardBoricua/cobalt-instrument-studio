import { Check, ShieldCheck, TriangleAlert, Radio } from "lucide-react";
import { activeAlerts } from "../engine/diagnostics";
import { formatTime, metricInfo } from "../engine/model";
import type { Action } from "../engine/studio";
import type { StudioState } from "../engine/types";

export function AlertList({
  state,
  dispatch,
}: {
  state: StudioState;
  dispatch: React.Dispatch<Action>;
}) {
  const alerts = activeAlerts(state.diagnostics);
  return (
    <section className="panel alert-panel" aria-label="Active alerts">
      <div className="section-title">
        <h2>Active alerts</h2>
        <span className="count-badge">{alerts.length}</span>
      </div>
      <p className="muted small">
        Acknowledgment records review. Conditions clear on recovery.
      </p>
      {!alerts.length ? (
        <div className="healthy-state">
          <ShieldCheck size={30} />
          <strong>All monitored conditions normal</strong>
          <p>Run a fault scenario to inspect alert transitions.</p>
        </div>
      ) : (
        <div className="alert-list">
          {alerts.map((a) => (
            <div
              className={`alert-item ${a.severity}`}
              key={a.key}
              data-testid={`alert-${a.key}`}
            >
              <div className="alert-icon">
                {a.key === "communication" ? (
                  <Radio size={20} />
                ) : (
                  <TriangleAlert size={20} />
                )}
              </div>
              <div className="alert-body">
                <div>
                  <strong>
                    {a.key === "communication"
                      ? "Communication loss"
                      : metricInfo[a.key].label}
                  </strong>
                  <span className={`severity-tag ${a.severity}`}>
                    {a.severity}
                  </span>
                </div>
                <p>{a.reason}</p>
                <small>
                  Active since {formatTime(a.since)} simulation time
                </small>
              </div>
              <button
                className="button secondary small-button"
                disabled={a.acknowledged}
                onClick={() => dispatch({ type: "ack", key: a.key })}
                aria-label={`Acknowledge ${a.key === "communication" ? "communication loss" : metricInfo[a.key].label}`}
              >
                {a.acknowledged ? (
                  <>
                    <Check size={14} />
                    Acknowledged
                  </>
                ) : (
                  "Acknowledge"
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
export function EventHistory({
  state,
  compact = false,
}: {
  state: StudioState;
  compact?: boolean;
}) {
  const events = [...state.diagnostics.events]
    .reverse()
    .slice(0, compact ? 5 : 100);
  return (
    <section className="panel event-panel" aria-label="Recent event history">
      <div className="section-title">
        <h2>Recent events</h2>
        <span className="small-label">SIMULATION TIME</span>
      </div>
      <div
        className={`event-list ${compact ? "compact" : ""}`}
        data-testid="event-history"
      >
        {events.map((event) => (
          <div className="event-row" key={event.id}>
            <span
              className={`status-dot ${event.severity}`}
              aria-hidden="true"
            />
            <time className="mono">{formatTime(event.time)}</time>
            <p>{event.message}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
