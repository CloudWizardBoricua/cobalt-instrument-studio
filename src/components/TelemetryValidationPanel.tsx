import { CheckCircle2, ShieldAlert } from "lucide-react";
import { formatTime } from "../engine/model";
import type { Simulation } from "../engine/types";

export function TelemetryValidationPanel({
  simulation,
  stale,
  running,
}: {
  simulation: Simulation;
  stale: boolean;
  running: boolean;
}) {
  const delivery = simulation.delivery;
  const rejected = delivery.status === "rejected";
  const status = rejected
    ? "Sample rejected"
    : delivery.status === "recovered"
      ? "Delivery recovered"
      : "Samples accepted";
  return (
    <section
      className={`panel validation-panel ${rejected ? "validation-rejected" : ""}`}
      aria-label="Telemetry validation"
    >
      <div className="validation-heading">
        {rejected ? (
          <ShieldAlert size={20} className="warning" aria-hidden="true" />
        ) : (
          <CheckCircle2 size={20} className="normal" aria-hidden="true" />
        )}
        <div>
          <h2 data-testid="validation-status">{status}</h2>
          <p className="muted small">
            {rejected
              ? "Last valid readings retained. Rejected delivery does not refresh sample age."
              : delivery.status === "recovered"
                ? "A valid sample resumed delivery. Rejection evidence remains below."
                : "Version 1 contract checks values and sample order before diagnostics."}
          </p>
        </div>
        <span className={`validation-state ${stale ? "critical" : "muted"}`}>
          {stale
            ? "Stale readings"
            : !running
              ? "Simulation paused / ready"
              : "Fresh readings"}
        </span>
      </div>
      <dl className="validation-facts">
        <div>
          <dt>Last valid sample</dt>
          <dd className="mono" data-testid="last-valid-time">
            {formatTime(simulation.receivedAt)}
          </dd>
        </div>
        <div>
          <dt>Sample age</dt>
          <dd className="mono" data-testid="valid-sample-age">
            {(simulation.time - simulation.receivedAt).toFixed(1)} s
          </dd>
        </div>
        <div>
          <dt>Accepted / rejected</dt>
          <dd className="mono">
            <span data-testid="accepted-count">{delivery.acceptedCount}</span> /{" "}
            <span data-testid="rejected-count">{delivery.rejectedCount}</span>
          </dd>
        </div>
        {delivery.lastRecoveryAt !== null && (
          <div>
            <dt>Recovered at</dt>
            <dd className="mono" data-testid="delivery-recovery-time">
              {formatTime(delivery.lastRecoveryAt)}
            </dd>
          </div>
        )}
      </dl>
      {!!delivery.issues.length && (
        <details className="rejection-details" open={rejected}>
          <summary>
            {rejected
              ? "Current rejection evidence"
              : "Last rejection evidence"}
          </summary>
          <ul data-testid="rejection-reasons">
            {delivery.issues.map((issue, i) => (
              <li key={`${issue.code}-${issue.field}-${i}`}>
                <code>{issue.code}</code> · {issue.message}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
