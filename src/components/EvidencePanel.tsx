/**
 * Explain and export the simulator evidence visible during a demo.
 * CSV serializers consume bounded accepted history/events from the central studio state;
 * downloads stay in the browser and explicitly identify simulated data. PDF/DOCX are frozen
 * engineering reports copied by the build, not generated from the current browser session.
 * BASE_URL keeps report links valid at both hosting bases. VITE_SOURCE_URL is a public build
 * setting and is shown only for the allowlisted GitHub project URL; never put secrets there.
 */
import { Download, FileText, BookOpen, ArrowUpRight, Cpu } from "lucide-react";
import { EVENT_CAPACITY, HISTORY_CAPACITY, UPDATE_MS } from "../engine/instruments";
import { exportEvents, exportTelemetry } from "../engine/studio-state";
import type { StudioState } from "../engine/types";

// Use a short-lived object URL; revoke after the browser has had time to begin downloading.
export function downloadCsv(name: string, data: string) {
  const url = URL.createObjectURL(
    new Blob([data], { type: "text/csv;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
// Summarize model timing/capacity/seed and age; age pauses with simulation time.
export function EvidencePanel({ state }: { state: StudioState }) {
  const age = state.simulation.time - state.simulation.receivedAt;
  const sourceUrl = import.meta.env.VITE_SOURCE_URL;
  return (
    <section className="panel evidence-panel" aria-label="Engineering evidence">
      <div className="section-title">
        <h2>
          <Cpu size={17} />
          Engineering evidence
        </h2>
        <span className="small-label">INSPECTABLE BY DESIGN</span>
      </div>
      <div className="evidence-grid">
        <div>
          <span>Model interval</span>
          <strong>{UPDATE_MS} ms</strong>
          <small>Fixed simulation step</small>
        </div>
        <div>
          <span>Retained samples</span>
          <strong data-testid="sample-count">
            {state.history.length} <small>/ {HISTORY_CAPACITY}</small>
          </strong>
          <small>Up to 120 s of fresh samples</small>
        </div>
        <div>
          <span>Replay seed</span>
          <strong>{state.simulation.seed}</strong>
          <small>{state.simulation.scenario}</small>
        </div>
        <div>
          <span>Sample age</span>
          <strong data-testid="sample-age">{age.toFixed(1)} s</strong>
          <small>
            {state.running ? "Simulation time" : "Paused simulation time"}
          </small>
        </div>
      </div>
      <div className="evidence-footer">
        <p>
          All values are generated in this browser. History is capped at{" "}
          {HISTORY_CAPACITY} samples; events at {EVENT_CAPACITY}. No equipment
          connection.
        </p>
        <div className="evidence-actions">
          <button
            className="button secondary small-button"
            onClick={() =>
              downloadCsv(
                "cobalt-simulated-telemetry.csv",
                exportTelemetry(state),
              )
            }
          >
            <Download size={14} />
            Telemetry CSV
          </button>
          <button
            className="button secondary small-button"
            onClick={() =>
              downloadCsv("cobalt-simulated-events.csv", exportEvents(state))
            }
          >
            <Download size={14} />
            Event CSV
          </button>
        </div>
      </div>
{/* Retain report filenames and base-aware URLs: they are existing public download contracts. */}
      <div className="report-links">
        <span>
          <BookOpen size={15} />
          Engineering report
        </span>
        <a
          href={`${import.meta.env.BASE_URL}reports/Cobalt_Engineering_Report.pdf`}
          target="_blank"
          rel="noreferrer"
        >
          <FileText size={14} />
          PDF
          <ArrowUpRight size={13} />
        </a>
        <a
          href={`${import.meta.env.BASE_URL}reports/Cobalt_Engineering_Report.docx`}
          download
        >
          <FileText size={14} />
          Editable DOCX
          <Download size={13} />
        </a>
        {sourceUrl &&
          /^https:\/\/github\.com\/[\w.-]+\/cobalt-instrument-studio\/?$/.test(
            sourceUrl,
          ) && (
            <a href={sourceUrl} target="_blank" rel="noreferrer">
              Source
              <ArrowUpRight size={13} />
            </a>
          )}
      </div>
    </section>
  );
}
