import { scan } from "react-scan"; // import this BEFORE react
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { GlobalProvider } from "./contexts/GlobalContext";

const container = document.getElementById("root");

const root = createRoot(container);

if (typeof window !== "undefined") {
  scan({
    enabled: true,
    log: true, // logs render info to console (default: false)
  });
}

root.render(
  <GlobalProvider>
    <App />
  </GlobalProvider>
);
