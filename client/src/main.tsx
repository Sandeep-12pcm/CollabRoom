import "./wdyr";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import { SystemStatusProvider } from "./context/SystemStatusContext";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SystemStatusProvider>
      <App />
    </SystemStatusProvider>
    <SpeedInsights />
    <Analytics />
  </React.StrictMode>
);
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js");
  });
}

