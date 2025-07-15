import {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
  ReactNode,
} from "react";

import { loadSettings } from "../helpers/settingsFile";
import { useSettings } from "./SettingsContext";
import { invoke } from "@tauri-apps/api/core";

import { GamesConfig, OBSSettings } from "../types/settings";
import yodaSound from "../assets/yoda.mp3";

import {
  obs,
  connectOBS,
  setOutputPathForGame,
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
}

const RecordingContext = createContext<RecordingContextValue | undefined>(
  undefined,
);

interface RecordingProviderProps {
  children: ReactNode;
}

export const RecordingProvider = ({ children }: RecordingProviderProps) => {
  const { settings, loadedSettings } = useSettings();

  const [connection, setConnection] = useState<ConnectionState>({
    status: "disconnected",
    version: null,
    error: null,
  });

  const [obsSetting, setObsSetting] = useState<OBSSettings>({
    port: null,
    password: null,
  });

  const gameDetectionInterval = useRef<NodeJS.Timeout | null>(null);

  const clearGameDetectionInterval = () => {
    if (gameDetectionInterval.current) {
      clearInterval(gameDetectionInterval.current);
      gameDetectionInterval.current = null;
    }
  };

  const playSound = () => {
    const audio = new Audio(yodaSound);
    audio.play().catch((err) => console.error("Failed to play sound:", err));
  };

  useEffect(() => {
    const handleConnectionClosed = (data: { message?: string }) => {
      console.log("OBS WebSocket disconnected:", data);

      clearGameDetectionInterval();
      setConnection({
        status: "disconnected",
        version: null,
        error: data?.message || "Connection closed",
      });
    };

    const handleConnectionError = (error: Error) => {
      console.error("OBS WebSocket error:", error);

      clearGameDetectionInterval();
      setConnection({
        status: "error",
        version: null,
        error: error.message,
      });
    };

    obs.on("ConnectionClosed", handleConnectionClosed);
    obs.on("ConnectionError", handleConnectionError);

    return () => {
      obs.off("ConnectionClosed", handleConnectionClosed);
      obs.off("ConnectionError", handleConnectionError);
    };
  }, []);

  useEffect(() => {
    const start = async () => {
      const loadedSettings = await loadSettings(null);
      setObsSetting(loadedSettings.obs);
    };
    start();
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        if (obsSetting.port && obsSetting.password) {
          await connect(obsSetting.port, obsSetting.password);
        }
      } catch (error) {
        console.error("Failed to initialize recording context:", error);
      }
    };

    initialize();
  }, [obsSetting]);

  useEffect(() => {
    if (loadedSettings && connection.status === "connected") {
      clearGameDetectionInterval();
      startGameDetection(settings);
    }
  }, [connection, settings, loadedSettings]);

  const connect = async (port: string, password: string): Promise<boolean> => {
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

  const startRecording = async (
    currentGame: string,
    record: boolean,
  ): Promise<{ success: boolean; message?: string }> => {
    if (settings.gamesDir) {
      await setOutputPathForGame(currentGame, settings.gamesDir);
    }
    return await startOBSRecording(
      currentGame,
      record,
      settings.recordingSoundEnabled,
      playSound,
    );
  };

  const stopRecording = async (
    record: boolean,
  ): Promise<{ success: boolean; message?: string }> => {
    return await stopOBSRecording(record);
  };

  async function checkGameRunning(
    gamesConfig: GamesConfig,
  ): Promise<[string | null, boolean | null]> {
    if (connection.status !== "connected") return [null, null];
    try {
      const { running_processes } = await invoke<{
        running_processes: string[];
      }>("get_running_processes");

      const processGameMap = new Map<string, [string, boolean]>();
      for (const [gameName, config] of Object.entries(gamesConfig)) {
        for (const processName of config.processes) {
          processGameMap.set(processName.toLowerCase(), [
            gameName,
            config.record,
          ]);
        }
      }

      for (const process of running_processes) {
        const gameInfo = processGameMap.get(process.toLowerCase());
        if (gameInfo) {
          return gameInfo;
        }
      }

      return [null, null];
    } catch (error) {
      console.error("Error checking running processes:", error);
      return [null, null];
    }
  }

  function startGameDetection(gameSettings: { gamesConfig: GamesConfig }) {
    let lastDetectedRecord: boolean | null = null;
    let lastDetectedGame: string | null = null;

    const interval = setInterval(async () => {
      const [currentGame, record] = await checkGameRunning(
        gameSettings.gamesConfig,
      );

      if (currentGame !== lastDetectedGame) {
        if (currentGame) {
          console.log(`${currentGame} detected! Starting OBS recording.`);
          try {
            await startRecording(currentGame, record ?? false);
            console.log(`Started recording for ${currentGame}`);
          } catch (error) {
            console.error("Failed to start recording:", error);
          }
        } else if (lastDetectedGame) {
          try {
            await stopRecording(lastDetectedRecord ?? false);
            console.log(`Stopped recording for ${lastDetectedGame}`);
          } catch (error) {
            console.error("Failed to stop recording:", error);
          }
        }

        lastDetectedGame = currentGame;
        lastDetectedRecord = record;
      }
    }, 2500);

    gameDetectionInterval.current = interval;

    return () => {
      clearInterval(interval);
    };
  }

  const value: RecordingContextValue = {
    connection,
    connect,
    obsSetting,
    setObsSetting,
    startGameDetection,
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
