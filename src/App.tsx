import { useEffect, useReducer, useState } from "react";
import {
  Activity,
  LayoutDashboard,
  ShieldCheck,
  Settings2,
  Sun,
  Moon,
  ChevronRight,
  ExternalLink,
  CircleHelp,
  Radio,
  CheckCircle2,
} from "lucide-react";
import { Gauge } from "./components/Gauge";
import { TrendChart } from "./components/TrendChart";
import { ControlPanel } from "./components/ControlPanel";
import { EvidencePanel } from "./components/EvidencePanel";
import { AlertList, EventHistory } from "./components/DiagnosticsPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { activeAlerts } from "./engine/diagnostics";
import { DISCLAIMER, formatTime, metricInfo } from "./engine/model";
import {
  defaultSettings,
  readSettings,
  writeSettings,
} from "./engine/settings";
import { createStudio, studioReducer } from "./engine/studio";
import { METRICS, type Metric } from "./engine/types";

type View = "Dashboard" | "Diagnostics" | "Settings";
function initialStudio() {
  try {
    return createStudio(readSettings(window.localStorage));
  } catch {
    return createStudio(structuredClone(defaultSettings));
  }
}
export function App() {
  const [state, dispatch] = useReducer(studioReducer, undefined, initialStudio);
  const [view, setView] = useState<View>("Dashboard");
  const [series, setSeries] = useState<Metric>("rpm");
  const [persisted, setPersisted] = useState(true);
  const [help, setHelp] = useState(false);
  const s = state.simulation;
  const alerts = activeAlerts(state.diagnostics);
  const stale = s.time - s.receivedAt >= state.settings.timeoutSeconds;
  const severity = alerts.some((a) => a.severity === "critical")
    ? "critical"
    : alerts.length
      ? "warning"
      : "normal";
  useEffect(() => {
    if (!state.running) return;
    const timer = setInterval(() => dispatch({ type: "tick" }), 500);
    return () => clearInterval(timer);
  }, [state.running]);
  useEffect(() => {
    document.documentElement.dataset.theme = state.settings.theme;
    try {
      setPersisted(writeSettings(window.localStorage, state.settings));
    } catch {
      setPersisted(false);
    }
  }, [state.settings]);
  const titles = {
    Dashboard: [
      "Instrument dashboard",
      "A clear view of every operating condition.",
    ],
    Diagnostics: [
      "System diagnostics",
      "Inspect the condition, its trigger, and its recovery.",
    ],
    Settings: [
      "Studio settings",
      "Configure display preferences and diagnostic behavior.",
    ],
  };
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <Activity size={24} />
          </span>
          <span>
            <strong>COBALT</strong>
            <small>INSTRUMENT STUDIO</small>
            <span className="developer-credit">Developed by Daren Diaz</span>
          </span>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {(
            [
              { name: "Dashboard", icon: LayoutDashboard },
              { name: "Diagnostics", icon: ShieldCheck },
              { name: "Settings", icon: Settings2 },
            ] as const
          ).map(({ name, icon: Icon }) => (
            <button
              key={name}
              aria-label={name}
              className={`nav-item ${view === name ? "active" : ""}`}
              aria-current={view === name ? "page" : undefined}
              onClick={() => setView(name)}
            >
              <Icon size={19} />
              <span>{name}</span>
              {name === "Diagnostics" && alerts.length > 0 && (
                <span className="nav-count" aria-hidden="true">
                  {alerts.length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <Radio size={19} />
          <strong>Browser simulation</strong>
          <p>
            Reproducible telemetry.
            <br />
            No equipment connection.
          </p>
          <span className="mono">ENGINE v0.1.0</span>
        </div>
        <div className="sidebar-bottom">
          <a
            href={`${import.meta.env.BASE_URL}reports/Cobalt_Engineering_Report.pdf`}
            target="_blank"
            rel="noreferrer"
          >
            Engineering report
            <ExternalLink size={14} />
          </a>
          <button onClick={() => setHelp((v) => !v)} aria-expanded={help}>
            <CircleHelp size={15} />
            How to explore
          </button>
          <p>Independent instrumentation project</p>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Studio</span>
            <ChevronRight size={13} />
            <strong>{view}</strong>
          </div>
          <div className="topbar-right">
            <span className="local-tag">
              <span className="status-dot normal" />
              LOCAL ENGINE
            </span>
            <button
              className="icon-button"
              aria-label={`Switch to ${state.settings.theme === "night" ? "day" : "night"} mode`}
              onClick={() =>
                dispatch({
                  type: "settings",
                  settings: {
                    ...state.settings,
                    theme: state.settings.theme === "night" ? "day" : "night",
                  },
                })
              }
            >
              {state.settings.theme === "night" ? (
                <Sun size={18} />
              ) : (
                <Moon size={18} />
              )}
            </button>
          </div>
        </header>
        <main id="main-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">TELEMETRY & DIAGNOSTICS</div>
              <h1>{titles[view][0]}</h1>
              <p>{titles[view][1]}</p>
            </div>
            <div
              className={`session-badge ${stale ? "critical" : state.running ? "normal" : ""}`}
            >
              <span
                className={`status-dot ${stale ? "critical" : state.running ? "normal" : "paused"}`}
              />
              <span data-testid="session-status">
                {stale
                  ? "DATA STALE"
                  : state.running
                    ? "SIMULATION RUNNING"
                    : s.time === 0
                      ? "READY TO START"
                      : "SIMULATION PAUSED"}
              </span>
            </div>
          </div>
          <div className="simulation-notice">
            <Radio size={15} />
            <strong>{DISCLAIMER}</strong>
            <span>Generated locally · fixed seed {s.seed}</span>
          </div>
          {help && (
            <section className="panel help-panel">
              <h2>Explore the simulator</h2>
              <p>
                Choose a guided scenario, then select Run scenario to start a
                repeatable run. Watch the instruments, then open Diagnostics to
                inspect transitions and acknowledge alerts. Pause freezes
                simulation time; Reset starts a fresh session. Settings persist
                only display and threshold preferences.
              </p>
              <p>
                Coolant overheat reaches warning and critical conditions.
                Communication loss freezes received readings while the model
                continues, then recovers when samples resume.
              </p>
              <button className="text-button" onClick={() => setHelp(false)}>
                Close guide
              </button>
            </section>
          )}
          {view !== "Settings" && (
            <div className="summary-strip">
              <div>
                <span>Operating mode</span>
                <strong data-testid="operating-mode">{s.mode}</strong>
              </div>
              <div>
                <span>Simulation time</span>
                <strong className="mono" data-testid="simulation-time">
                  {formatTime(s.time)}
                </strong>
              </div>
              <div>
                <span>Sample delivery</span>
                <strong
                  className={stale ? "critical" : ""}
                  data-testid="delivery-status"
                >
                  {stale
                    ? "Communication loss"
                    : s.time > s.receivedAt
                      ? "Awaiting sample"
                      : state.running
                        ? "Fresh samples"
                        : "Suspended"}
                </strong>
              </div>
              <div>
                <span>Diagnostic state</span>
                <strong className={severity} data-testid="diagnostic-status">
                  {severity === "normal" ? (
                    <>
                      <CheckCircle2 size={14} />
                      Normal
                    </>
                  ) : (
                    `${alerts.length} active ${alerts.length === 1 ? "alert" : "alerts"}`
                  )}
                </strong>
              </div>
            </div>
          )}
          {view === "Dashboard" && (
            <>
              <div className="dashboard-layout">
                <div className="instrument-column">
                  <div className="instruments-title">
                    <h2>Live instruments</h2>
                    <span className="muted small">
                      6 channels · 500 ms model step
                    </span>
                  </div>
                  <div className="gauge-grid">
                    {METRICS.filter((m) => state.settings.visible[m]).map(
                      (metric) => (
                        <Gauge
                          key={metric}
                          metric={metric}
                          value={s.received[metric]}
                          severity={state.diagnostics.alerts[metric].severity}
                          stale={stale}
                          settings={state.settings}
                        />
                      ),
                    )}
                  </div>
                  {!METRICS.some((m) => state.settings.visible[m]) && (
                    <div className="panel empty-state">
                      <h3>No instruments selected</h3>
                      <p>Choose visible instruments in Settings.</p>
                      <button
                        className="button secondary"
                        onClick={() => setView("Settings")}
                      >
                        Open settings
                      </button>
                    </div>
                  )}
                  <section className="panel trends-panel">
                    <div className="section-title">
                      <div>
                        <h2>Telemetry trend</h2>
                        <p className="muted small">
                          Received samples · bounded retention
                        </p>
                      </div>
                      <label className="chart-select">
                        Series
                        <select
                          aria-label="Trend series"
                          value={series}
                          onChange={(e) => setSeries(e.target.value as Metric)}
                        >
                          {METRICS.map((m) => (
                            <option key={m} value={m}>
                              {metricInfo[m].label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <TrendChart
                      history={state.history}
                      metric={series}
                      settings={state.settings}
                    />
                    <div className="chart-footer">
                      <span>
                        <span
                          className="legend-line"
                          style={{ background: metricInfo[series].color }}
                        />
                        {metricInfo[series].label}
                      </span>
                      <span>
                        {state.history.length} samples retained
                        {stale ? " · no fresh samples" : ""}
                      </span>
                    </div>
                  </section>
                </div>
                <ControlPanel state={state} dispatch={dispatch} />
              </div>
              {alerts.length > 0 && (
                <div className="dashboard-alert-summary" role="status">
                  <TriangleSummary severity={severity} />
                  <span>
                    {alerts.length} active{" "}
                    {alerts.length === 1 ? "condition" : "conditions"}.{" "}
                    {stale
                      ? "Displayed instrument values are stale."
                      : "Open Diagnostics to inspect and acknowledge."}
                  </span>
                  <button
                    className="text-button"
                    onClick={() => setView("Diagnostics")}
                  >
                    View diagnostics
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
              <EvidencePanel state={state} />
              <EventHistory state={state} compact />
            </>
          )}
          {view === "Diagnostics" && (
            <>
              <div className="diagnostics-layout">
                <div>
                  <AlertList state={state} dispatch={dispatch} />
                  <EventHistory state={state} />
                </div>
                <ControlPanel state={state} dispatch={dispatch} />
              </div>
              <EvidencePanel state={state} />
            </>
          )}
          {view === "Settings" && (
            <SettingsPanel
              settings={state.settings}
              dispatch={dispatch}
              persisted={persisted}
            />
          )}
          <footer className="page-footer">
            <span>
              Cobalt Instrument Studio <span className="mono">0.1.0</span>
            </span>
            <span>Simulation for exploration · no safety control</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
function TriangleSummary({ severity }: { severity: string }) {
  return <ShieldCheck className={severity} size={19} />;
}
