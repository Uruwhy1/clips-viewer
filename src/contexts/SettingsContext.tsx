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
import { loadSettings, saveSettings } from "../helpers/settingsFile";
import { Settings } from "../types/settings";

interface SettingsContextType {
  settings: Settings;
  setSettings: Dispatch<SetStateAction<Settings>>;
  updateSettings: (newSettings: Partial<Settings>) => void;
  loadedSettings: boolean;
}

interface SettingsProviderProps {
  children: ReactNode;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [settings, setSettings] = useState<Settings>({
    gamesDir: null,
    gamesConfig: {},
    scrollbarOff: false,
    clipDeletion: false,
    clipsDeleteThreshold: 999999,
    obs: {
      port: "0",
      password: "",
    },
  });
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
