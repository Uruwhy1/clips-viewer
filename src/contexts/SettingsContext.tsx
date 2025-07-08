import {
  createContext,
  useState,
  useEffect,
  useRef,
  useContext,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import {
  defaultSettings,
  loadSettings,
  saveSettings,
} from "../helpers/settingsFile";
import { Settings } from "../types/settings";

interface SettingsContextType {
  settings: Settings;
  setSettings: Dispatch<SetStateAction<Settings>>;
  updateSettings: (newSettings: Partial<Settings>) => void;
  loadedSettings: boolean;
}

export type RecordingMethod = "obs" | "wgc";

interface SettingsProviderProps {
  children: ReactNode;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loadedSettings, setLoadedSettings] = useState<boolean>(false);
  const settingsRef = useRef(settings);

  useEffect(() => {
    const load = async () => {
      await loadSettings(setSettings);
      setLoadedSettings(true);
    };
    load();
  }, []);

  useEffect(() => {
    settingsRef.current = settings;
    if (settings.scrollbarOff) {
      document.body.classList.add("hide-scroll");
    } else {
      document.body.classList.remove("hide-scroll");
    }
  }, [settings]);

  useEffect(() => {
    let accent = settings.accentVariable;
    document.documentElement.style.setProperty(
      "--accent-var",
      `var(${accent})`
    );

    let theme = settings.theme;
    if (theme === "System (Default)") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      document.documentElement.setAttribute(
        "data-theme",
        prefersDark ? "Dark" : "Light"
      );

      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
        document.documentElement.setAttribute(
          "data-theme",
          e.matches ? "Dark" : "Light"
        );
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else if (theme === "System (Catppuccin)") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      document.documentElement.setAttribute(
        "data-theme",
        prefersDark ? "Mocha" : "Latte"
      );

      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
        document.documentElement.setAttribute(
          "data-theme",
          e.matches ? "Mocha" : "Latte"
        );
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [settings.theme]);

  useEffect(() => {
    const save = async () => {
      if (loadedSettings) {
        await saveSettings(settings);
      }
    };
    save();
  }, [settings, loadedSettings]);

  const updateSettings = (newSettings: Partial<Settings>): void => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const contextValue: SettingsContextType = {
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

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

export default SettingsContext;
