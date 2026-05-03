import { createRoot } from "react-dom/client";
import App from "./App";

import { AppProvider } from "./contexts/AppProvider";
import PersistentListener from "./BackendGlobalListener";

const container = document.getElementById("root") as HTMLElement | null;

if (container) {
  const root = createRoot(container);

  root.render(
    <AppProvider>
      <PersistentListener>
        <App />
      </PersistentListener>
    </AppProvider>
  );
} else {
  console.error("Root element not found.");
}
