import {
  METRICS,
  type Metric,
  type SampleIssue,
  type Simulation,
  type Telemetry,
  type TelemetryEnvelope,
} from "./types";

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

export type TelemetryValidation =
  | { ok: true; sample: TelemetryEnvelope; issues: [] }
  | { ok: false; issues: SampleIssue[] };

export interface ValidationContext {
  simulationTime: number;
  lastAcceptedTimestamp?: number;
}

export function createTelemetryEnvelope(values: Telemetry): TelemetryEnvelope {
  return { contractVersion: TELEMETRY_CONTRACT.version, ...values };
}

// No numeric coercion: strings, missing fields, non-finite values, and stale ordering fail closed.
// Successful output is an owned whitelist copy; unknown input fields never enter the model.
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
