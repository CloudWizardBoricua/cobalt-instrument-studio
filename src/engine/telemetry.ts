/**
 * Runtime acceptance boundary between generated measurements and HMI consumers.
 * simulation.ts submits candidates here; only an owned, validated sample can
 * replace Simulation.received. Rejection preserves the last valid readings and
 * their measurement age, while delivery counters/notices explain the failure.
 *
 * This models data-quality checks useful at an industrial acquisition boundary.
 * It implements no external transport, device authentication, CRC, protocol
 * decoder, wall-clock synchronization, or fail-safe action. Future hardware
 * integration would need those separately reviewed requirements and calibrated
 * limits rather than adopting these demonstration bounds as equipment limits.
 */
import {
  METRICS,
  type Metric,
  type SampleIssue,
  type Simulation,
  type Telemetry,
  type TelemetryEnvelope,
} from "./types";

// The versioned whitelist separates plausible accepted values from narrower
// display scales and configurable alarm thresholds. Units are canonical here.
// These are documented demonstration plausibility limits, not calibrated equipment limits.
export const TELEMETRY_CONTRACT = {
  id: "cobalt-telemetry-v1",
  version: 1 as const,
  fields: {
    rpm: { label: "Engine speed", unit: "rpm", min: 0, max: 6000 },
    oilPressure: { label: "Oil pressure", unit: "psi", min: 0, max: 150 },
    coolantTemp: {
      label: "Coolant temperature",
      unit: "°F",
      min: -40,
      max: 320,
    },
    batteryVoltage: { label: "Battery voltage", unit: "V", min: 0, max: 32 },
    fuelLevel: { label: "Fuel level", unit: "%", min: 0, max: 100 },
    engineLoad: { label: "Engine load", unit: "%", min: 0, max: 100 },
  } satisfies Record<
    Metric,
    { label: string; unit: string; min: number; max: number }
  >,
  timestamp: {
    unit: "simulation seconds",
    min: 0,
    policy:
      "Finite, nonnegative, no later than simulation time, strictly newer than the last accepted sample.",
  },
};

// The discriminated result prevents downstream callers from treating a rejected
// candidate as a usable sample. Structured issue codes drive visible evidence.
export type TelemetryValidation =
  | { ok: true; sample: TelemetryEnvelope; issues: [] }
  | { ok: false; issues: SampleIssue[] };

// Context comes from the internal fixed-step model. Timestamps refer to that
// simulation clock, so a future acquisition adapter must define its own mapping.
export interface ValidationContext {
  simulationTime: number;
  lastAcceptedTimestamp?: number;
}

/** Attach contract identity to generated values; validation still happens later. */
export function createTelemetryEnvelope(values: Telemetry): TelemetryEnvelope {
  return { contractVersion: TELEMETRY_CONTRACT.version, ...values };
}

/**
 * Check object shape, own required fields, exact version, finite numeric values,
 * demonstration bounds, and timestamp order without numeric coercion. Read each
 * measurement once and copy the checked snapshot; ignore unknown input fields.
 * This pure check reports all applicable issues before allowing a state update.
 */
export function validateTelemetrySample(
  candidate: unknown,
  context: ValidationContext,
): TelemetryValidation {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return {
      ok: false,
      issues: [
        {
          code: "malformed",
          field: "sample",
          message: "Sample must be a telemetry object.",
        },
      ],
    };
  }
  const raw = candidate as Record<string, unknown>;
  const issues: SampleIssue[] = [];
  const sample = { contractVersion: 1 } as TelemetryEnvelope;
  const own = (key: string) => Object.prototype.hasOwnProperty.call(raw, key);
  if (!own("contractVersion")) {
    issues.push({
      code: "missing-field",
      field: "contractVersion",
      message: "Required field contractVersion is missing.",
    });
  } else if (raw.contractVersion !== TELEMETRY_CONTRACT.version) {
    issues.push({
      code: "contract-version",
      field: "contractVersion",
      message: "Unsupported telemetry contract version; expected 1.",
    });
  }
  // Own fields prevent inherited data from satisfying the contract. Whitelisting
  // also avoids reading or propagating unrelated fields into accepted state.
  for (const field of ["time", ...METRICS] as const) {
    if (!own(field)) {
      issues.push({
        code: "missing-field",
        field,
        message: `Required field ${field} is missing.`,
      });
      continue;
    }
    const value = raw[field];
    if (typeof value !== "number") {
      issues.push({
        code: "numeric-type",
        field,
        message: `${field} must be a number; numeric strings are not accepted.`,
      });
      continue;
    }
    if (!Number.isFinite(value)) {
      issues.push({
        code: "non-finite",
        field,
        message: `${field} must be finite.`,
      });
      continue;
    }
    // Validate and copy the same snapshot; an accessor is never re-read after checking.
    sample[field] = value;
    // Time must be nonnegative, no later than the model, and strictly newer
    // than the previous accepted measurement. A delayed but newer sample can
    // pass: deliverTelemetry retains its original time for freshness checks.
    if (field === "time") {
      if (value < 0) {
        issues.push({
          code: "timestamp-bounds",
          field,
          message: "Sample timestamp must be nonnegative.",
        });
      } else if (value > context.simulationTime) {
        issues.push({
          code: "future-timestamp",
          field,
          message: "Sample timestamp is ahead of the simulation clock.",
        });
      } else if (
        context.lastAcceptedTimestamp !== undefined &&
        value <= context.lastAcceptedTimestamp
      ) {
        const duplicate = value === context.lastAcceptedTimestamp;
        issues.push({
          code: duplicate ? "duplicate-timestamp" : "out-of-order-timestamp",
          field,
          message: duplicate
            ? "Duplicate sample timestamp; an accepted sample already has this time."
            : "Out-of-order sample timestamp; sample is older than the last accepted sample.",
        });
      }
    } else {
      const bounds = TELEMETRY_CONTRACT.fields[field];
      if (value < bounds.min || value > bounds.max) {
        issues.push({
          code: "out-of-bounds",
          field,
          message: `${bounds.label} must be within ${bounds.min}–${bounds.max} ${bounds.unit} demonstration bounds.`,
        });
      }
    }
  }
  if (issues.length) return { ok: false, issues };
  return { ok: true, sample, issues: [] };
}

/**
 * Convert acceptance into an immutable delivery-state transition. Counts refer
 * to simulated attempts, not a physical link's loss rate. A rejection keeps the
 * previous sample; the first later success resets the rejection episode and
 * records recovery while retaining the last issue evidence for explanation.
 */
export function deliverTelemetry(
  simulation: Simulation,
  candidate: unknown,
): Simulation {
  const validation = validateTelemetrySample(candidate, {
    simulationTime: simulation.time,
    lastAcceptedTimestamp: simulation.received.time,
  });
  const previous = simulation.delivery;
  if (!validation.ok) {
    // Emit a notice only when a new code appears in this continuous episode.
    // Diagnostics records it once per attempt time, preventing repeated bad
    // samples from flooding the bounded event history with the same reason.
    const codes = [...new Set(validation.issues.map((issue) => issue.code))];
    const newCodes = codes.filter(
      (code) => !previous.episodeCodes.includes(code),
    );
    return {
      ...simulation,
      delivery: {
        ...previous,
        status: "rejected",
        rejectedCount: previous.rejectedCount + 1,
        consecutiveRejected: previous.consecutiveRejected + 1,
        lastAttemptAt: simulation.time,
        lastRejectedAt: simulation.time,
        issues: validation.issues,
        episodeCodes: [...new Set([...previous.episodeCodes, ...codes])],
        notices: newCodes.length
          ? [
              {
                kind: "validation",
                message: `Telemetry rejected (${newCodes.join(", ")}). ${validation.issues
                  .filter((issue) => newCodes.includes(issue.code))
                  .map((issue) => issue.message)
                  .join(" ")} Last valid instrument readings retained.`,
              },
            ]
          : [],
      },
    };
  }
  // Recovery is a successful delivery after rejection. The visible recovered
  // status persists on subsequent successes; counters and lastRecoveryAt retain
  // context until a new rejection episode or session reset.
  const recovered = previous.consecutiveRejected > 0;
  const { contractVersion: _version, ...received } = validation.sample;
  return {
    ...simulation,
    received,
    // Freshness follows measurement time, not an attempted or delayed delivery's arrival time.
    receivedAt: received.time,
    delivery: {
      ...previous,
      status:
        recovered || previous.status === "recovered" ? "recovered" : "accepted",
      acceptedCount: previous.acceptedCount + 1,
      consecutiveRejected: 0,
      lastAttemptAt: simulation.time,
      lastRecoveryAt: recovered ? simulation.time : previous.lastRecoveryAt,
      episodeCodes: [],
      notices: recovered
        ? [
            {
              kind: "recovery",
              message: `Telemetry delivery recovered. Valid contract v1 sample accepted after ${previous.consecutiveRejected} rejected attempts.`,
            },
          ]
        : [],
    },
  };
}
