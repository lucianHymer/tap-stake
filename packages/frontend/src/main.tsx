import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { initializeServerLogging } from "./lib/serverLogger";

// Initialize server logging for development
initializeServerLogging();

// Set Moloch theme on root element
document.documentElement.setAttribute("data-theme", "moloch");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
