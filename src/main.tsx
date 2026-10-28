/**
 * Browser entry point: mounts the single React application and shared studio stylesheet.
 * Vite reaches this conventional file from index.html; keep the entry and root element aligned.
 * StrictMode checks effect cleanup during development. App owns the timer and local settings;
 * this bootstrap starts no connection to machinery, gateway, or remote telemetry service.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles/studio.css";
// The HTML loading placeholder is replaced only after React loads successfully.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
