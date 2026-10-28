/**
 * Bounded accepted-sample trend rendered by Recharts.
 * History comes from the central reducer and remains in canonical units; conversion is local
 * to the selected display series. An explicit null point represents a delivery gap so the
 * chart does not imply uninterrupted measurements. No interpolation repairs missing input.
 * The short browser history is a presentation aid, not a durable industrial historian;
 * qualifying live trend quality, sampling and accessibility requires separate work.
 */
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  displayUnit,
  displayValue,
  formatTime,
  metricInfo,
  UPDATE_MS,
} from "../engine/instruments";
import type { Metric, Settings, Telemetry } from "../engine/types";
import { useId } from "react";

export function TrendChart({
  history,
  metric,
  settings,
}: {
  history: Telemetry[];
  metric: Metric;
  settings: Settings;
}) {
// Unique gradient IDs let dashboard and preview trends coexist without SVG collisions.
  const id = useId().replaceAll(":", "");
  const data: { time: number; value: number | null }[] = [];
// Insert a visible break when successive accepted measurements exceed the fixed sample interval.
  history.forEach((sample, index) => {
    const previous = history[index - 1];
    if (previous && sample.time - previous.time > UPDATE_MS / 1000) {
      data.push({ time: previous.time + UPDATE_MS / 1000, value: null });
    }
    data.push({
      time: sample.time,
      value: displayValue(metric, sample[metric], settings.units),
    });
  });
  const color = metricInfo[metric].color;
  return (
    <div
      className="trend-chart"
      role="img"
      aria-label={`${metricInfo[metric].label} trend with ${history.length} simulated samples, displayed in ${displayUnit(metric, settings.units)}.`}
    >
{/* Use a clear startup state before enough points exist; animation is disabled for stable readings. */}
      {history.length < 3 ? (
        <div className="chart-empty">
          <span className="pulse-line">⌁</span>
          <strong>Ready to capture telemetry</strong>
          <p>Start the simulator or run a guided scenario.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 12, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="var(--border)"
              vertical={false}
              strokeDasharray="3 6"
            />
            <XAxis
              dataKey="time"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={formatTime}
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={35}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={45}
              tickFormatter={(v) =>
                Number(v).toLocaleString("en-US", {
                  maximumFractionDigits:
                    metric === "rpm"
                      ? 0
                      : metric === "fuelLevel" || metric === "batteryVoltage"
                        ? 2
                        : 1,
                })
              }
            />
            <Tooltip
              contentStyle={{
                background: "var(--panel)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--text)",
              }}
              labelFormatter={(v) => `Simulation ${formatTime(Number(v))}`}
              formatter={(v) => [
                `${Number(v).toFixed(metric === "batteryVoltage" ? 2 : 1)} ${displayUnit(metric, settings.units)}`,
                metricInfo[metric].label,
              ]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              fill={`url(#${id})`}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
