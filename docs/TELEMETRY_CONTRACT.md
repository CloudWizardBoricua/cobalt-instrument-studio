# Telemetry contract and rejection behavior

_Developed by Daren Diaz_ · [GitHub repository](https://github.com/CloudWizardBoricua/cobalt-instrument-studio)

Fall 2026 · Local, unreleased hardening revision

**SIMULATED — NOT LIVE EQUIPMENT.** Contract version 1 validates browser-generated sample delivery at the boundary before diagnostics, history, instruments, or device preview consume it. These plausibility bounds are documented demonstration limits, not calibrated equipment operating limits or safety certification.

## Envelope and canonical units

```json
{
  "contractVersion": 1,
  "time": 0.5,
  "rpm": 1650,
  "oilPressure": 52,
  "coolantTemp": 182,
  "batteryVoltage": 13.8,
  "fuelLevel": 76,
  "engineLoad": 48
}
```

The envelope must be a non-null object rather than an array. Every listed field must be an own property. Numeric fields must be numbers and finite; numeric strings, null, booleans, NaN, and infinities are rejected without coercion. `contractVersion` must equal numeric `1`. Additional fields are ignored and never copied into accepted telemetry.

| Field            | Unit/meaning                       | Inclusive acceptance bounds                                                                             |
| ---------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `time`           | Seconds on this simulation's clock | At least 0; no later than current simulation time; strictly greater than last accepted sample timestamp |
| `rpm`            | Revolutions per minute             | 0–6000                                                                                                  |
| `oilPressure`    | psi                                | 0–150                                                                                                   |
| `coolantTemp`    | Degrees F                          | −40–320                                                                                                 |
| `batteryVoltage` | V                                  | 0–32                                                                                                    |
| `fuelLevel`      | Percent                            | 0–100                                                                                                   |
| `engineLoad`     | Percent                            | 0–100                                                                                                   |

All comparisons use canonical units. Metric appearance converts pressure to kPa and temperature to degrees C only during rendering. Acceptance limits deliberately differ from the generator's guarded ranges and instrument display domains. An accepted plausibility value can be outside a configured display scale; its number remains visible while the preview needle clamps and labels the scale exception.

## Timestamp and state ownership

The sample timestamp identifies the simulation measurement time. It must increase strictly; a timestamp equal to the last accepted sample is a duplicate, and an earlier timestamp is out of order. A future timestamp is rejected so it cannot make sample age negative. Replay/reset creates a new session and a new ordering baseline. Initial readings are a validated generated sample at time 0.

Accepted data is copied into a new canonical telemetry object field by field. The application retains no reference to arbitrary incoming fields. Only an accepted sample replaces readings, changes the accepted sample timestamp, appends history, or contributes to metric threshold debounce. The internal model continues advancing during missing/rejected delivery.

## Rejection categories

| Code                     | Meaning                                                          |
| ------------------------ | ---------------------------------------------------------------- |
| `malformed`              | Envelope is not the required object shape                        |
| `contract-version`       | A supplied version is unsupported                                |
| `missing-field`          | A required sample field, including contractVersion, is absent    |
| `numeric-type`           | A numeric field has another type                                 |
| `non-finite`             | A numeric field is NaN or infinite                               |
| `out-of-bounds`          | A channel is outside its documented inclusive plausibility range |
| `timestamp-bounds`       | Time is negative                                                 |
| `future-timestamp`       | Time exceeds current simulation time                             |
| `duplicate-timestamp`    | Time equals the last accepted timestamp                          |
| `out-of-order-timestamp` | Time precedes the last accepted timestamp                        |

One validation attempt reports all detected field issues; a malformed envelope fails before field inspection. Rejected attempts increase the rejection count while retaining accepted readings/history. The first occurrence of each rejection code in a continuous rejection episode produces diagnostic evidence. Repeated occurrences are counted but do not flood the event log. A subsequent accepted delivery logs one recovery event and starts a fresh episode for any later rejection. The delivery recovery status remains visible after later accepted samples until a new rejection or session reset.

## Freshness and diagnostics

Sample age is current simulation time minus the last accepted sample timestamp. A rejected sample does not reset age. Age at or above the configured timeout produces a communication alert and stale display state. This may coexist with sample-quality rejection evidence; they explain different aspects of the same delivery episode. A new current valid sample restores freshness and clears communication timeout automatically. An accepted delayed sample can still be stale when its measurement time is sufficiently old; acceptance never substitutes arrival time for measurement time. Pausing stops simulation time and therefore sample aging.

Rejected, duplicate, out-of-order, and missing deliveries do not count as metric debounce samples. Existing threshold conditions retain state until accepted values satisfy configured hysteresis/debounce. Acknowledgment leaves an active condition in place; escalation renews acknowledgment, and recovery clears it. Sample history is capped at 240 accepted readings and diagnostic events at 100. Trend gaps represent missing accepted data.

## Deterministic delivery replay

The invalid sample scenario starts rejecting deliveries at 5 s and resumes valid delivery at 17 s. Observed first rejection reasons occurred at 5 s (nonfinite pressure), 8 s (missing voltage), 9.5 s (string RPM), 11 s (duplicate time), and 14 s (out-of-order time). The display retained the 4.5 s sample during 24 rejected attempts; default two-second freshness expired at 6.5 s. Current valid delivery at 17 s replaced readings, recorded one delivery recovery, and cleared the communication alert. At 25 s, accepted count/history were 27 and rejected count was 24. These are deterministic reducer observations, not hardware or elapsed network measurements; [validation evidence](validation-evidence.json) and [the handoff](HANDOFF.md) record them.

Oil pressure loss is a simulated process fault, so valid low-pressure samples are accepted and evaluated by normal threshold rules. Its decline begins at 5 s, and pressure generation restores from 24 s. Observed warning was 11.5 s/22.199 psi; critical 15.5 s/14.726 psi; recovery through warning 26.0 s/23.410 psi; normal 27.5 s/30.110 psi. Its 42 s replay accepted 85 samples with no rejection. Treating this separately from invalid delivery avoids confusing a valid low-pressure value with an invalid message.

## Production gaps

No gateway protocol, actual device identity, authentication, sequence counter, wall-clock synchronization, checksum, physical calibration, or durable audit is implemented. Supporting field data would require a separately reviewed schema/version migration policy, device adapter, trust boundary, clock semantics, hardware testing, safety design, and operational diagnostics.
