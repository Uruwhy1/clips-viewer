import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";

import { useSettings } from "./SettingsContext";
import { GamesConfig, OBSSettings, RecordingMethod } from "../types/settings";
import {
  connectOBS,
  startOBSRecording,
  stopOBSRecording,
} from "../helpers/OBS";

interface ConnectionState {
  status: "disconnected" | "connected" | "error";
  version: string | null;
  error: string | null;
}

interface RecordingContextValue {
  connection: ConnectionState;
  connect: (port: string, password: string) => Promise<boolean>;
  obsSetting: OBSSettings;
  setObsSetting: (settings: OBSSettings) => void;
  startGameDetection: (settings: { gamesConfig: GamesConfig }) => void;
  recordingMethod: RecordingMethod;
}

const RecordingContext = createContext<RecordingContextValue | undefined>(undefined);

interface RecordingProviderProps {
  children: ReactNode;
}

export const RecordingProvider = ({ children }: RecordingProviderProps) => {
  const { settings } = useSettings();

  const [connection, setConnection] = useState<ConnectionState>({
    status: "disconnected",
    version: null,
    error: null,
  });

  const [obsSetting, setObsSetting] = useState<OBSSettings>({
    port: null,
    password: null,
  });

  useEffect(() => {
    if (settings.obs) {
      setObsSetting(settings.obs);
    }
  }, [settings.obs]);

  useEffect(() => {
    const initialize = async () => {
      try {
        if (
          settings.recordingMethod === "obs" &&
          obsSetting.port &&
          obsSetting.password
        ) {
          console.log(obsSetting.port)
          console.log("xd")
          await connectFn(obsSetting.port, obsSetting.password);
        }
      } catch (error) {
        console.error("Failed to initialize recording context:", error);
      }
    };

    initialize();
  }, [obsSetting, settings.recordingMethod]);

  const connectFn = async (port: string, password: string): Promise<boolean> => {
    if (settings.recordingMethod !== "obs") return false;

    const result = await connectOBS(port, password);
    if (result.success) {
      setConnection({
        status: "connected",
        version: result.version ?? null,
        error: null,
      });
      return true;
    } else {
      setConnection({
        status: "error",
        version: null,
        error: result.error ?? "Unknown error",
      });
      return false;
    }
  };

  const startGameDetection = () => {};

  const value: RecordingContextValue = {
    connection,
    connect: connectFn,
    obsSetting,
    setObsSetting,
    startGameDetection,
    recordingMethod: settings.recordingMethod,
  };

  return (
    <RecordingContext.Provider value={value}>
      {children}
    </RecordingContext.Provider>
  );
};

export const useRecording = (): RecordingContextValue => {
  const context = useContext(RecordingContext);
  if (!context) {
    throw new Error("useRecording must be used within a RecordingProvider");
  }
  return context;
};

export default RecordingContext;
