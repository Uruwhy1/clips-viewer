import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { GlobalProvider } from "./contexts/GlobalContext";
import { OBSProvider } from "./contexts/ObsContext";

const container = document.getElementById("root");

const root = createRoot(container);

root.render(
  <GlobalProvider>
    <OBSProvider>
      <App />
    </OBSProvider>
  </GlobalProvider>
);
