import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { GlobalProvider } from "./contexts/GlobalContext";
import { OBSProvider } from "./contexts/ObsContext";
import { PopupProvider } from "./contexts/PopupContext";

const container = document.getElementById("root");

const root = createRoot(container);

root.render(
  <GlobalProvider>
    <PopupProvider>
      <OBSProvider>
        <App />
      </OBSProvider>
    </PopupProvider>
  </GlobalProvider>
);
