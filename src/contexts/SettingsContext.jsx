import { createContext, useState, useEffect, useRef, useContext } from "react";
import { loadSettings, saveSettings } from "../helpers/settingsFile";

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    gamesDir: null,
    gamesConfig: {},
    scrollbarOff: false,
  });
  const [loadedSettings, setLoadedSettings] = useState(false);
  const settingsRef = useRef(settings);

  // Load settings on component mount
  useEffect(() => {
    const load = async () => {
      await loadSettings(setSettings);
      setLoadedSettings(true);
    };

    load();
  }, []);

  // Update ref when settings change
  useEffect(() => {
    settingsRef.current = settings;

    // Apply scrollbar setting
    if (settings.scrollbarOff) {
      document.body.classList.add("hide-scroll");
    } else {
      document.body.classList.remove("hide-scroll");
    }
  }, [settings]);

  // Save settings when they change
  useEffect(() => {
    const save = async () => {
      if (loadedSettings) {
        await saveSettings(settings);
      }
    };
    save();
  }, [settings, loadedSettings]);

  const updateSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const contextValue = {
    settings,
    setSettings,
    updateSettings,
    loadedSettings,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

export default SettingsContext;
