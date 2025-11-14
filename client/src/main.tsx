import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { SpeedInsights } from "@vercel/speed-insights/react"
<SpeedInsights/>
createRoot(document.getElementById("root")!).render(<App />);
