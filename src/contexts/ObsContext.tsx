import {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import OBSWebSocket, {
  OBSEventTypes,
  OBSRequestTypes,
  OBSResponseTypes,
} from "obs-websocket-js";

import { loadSettings } from "../helpers/settingsFile";
import { useSettings } from "./SettingsContext";
import { invoke } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";
import { mkdir } from "@tauri-apps/plugin-fs";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { GamesConfig, OBSSettings } from "../types/settings";
import yodaSound from "../assets/yoda.mp3";

interface ConnectionState {
  status: "disconnected" | "connected" | "error";
  version: string | null;
  error: string | null;
}

interface OBSContextValue {
  connection: ConnectionState;
  connect: (port: string, password: string) => Promise<boolean>;
  obsSetting: OBSSettings;
  setObsSetting: (settings: OBSSettings) => void;
  startGameDetection: (settings: { gamesConfig: GamesConfig }) => void;
}

const OBSContext = createContext<OBSContextValue | undefined>(undefined);

interface OBSProviderProps {
  children: ReactNode;
}

export const OBSProvider = ({ children }: OBSProviderProps) => {
  const { settings, loadedSettings } = useSettings();
  const [obs] = useState(() => new OBSWebSocket());
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
  }, [obs]);

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
        console.error("Failed to initialize OBS context:", error);
      }
    };

    initialize();
  }, [obsSetting]);

  useEffect(() => {
    if (connection.status === "connected" && loadedSettings) {
      clearGameDetectionInterval();
      startGameDetection(settings);
    }
  }, [connection, settings, loadedSettings]);

  const connect = async (port: string, password: string): Promise<boolean> => {
    try {
      await obs.connect(`ws://localhost:${port}`, password);
      const version = await obs.call("GetVersion");

      setConnection({
        status: "connected",
        version: version.obsVersion,
        error: null,
      });

      return true;
    } catch (error) {
      setConnection({
        status: "error",
        version: null,
        error: (error as Error).message,
      });

      return false;
    }
  };

  const startRecording = async (currentGame: string, record: boolean) => {
    try {
      await setSceneForGame(currentGame);

      if (record) {
        await obs.call("StartRecord");
      }
      await obs.call("StartReplayBuffer");

      if (settings.recordingSoundEnabled) playSound();

      return { success: true };
    } catch (error) {
      console.error("OBS Recording Start Error:", error);
      return { success: false, message: (error as Error).message };
    }
  };

  const stopRecording = async (record: boolean) => {
    try {
      if (record) {
        await obs.call("StopRecord");
      }
      await obs.call("StopReplayBuffer");

      location.reload();
      await getCurrentWindow().show();

      return { success: true };
    } catch (error) {
      console.error("OBS Recording Stop Error:", error);
      return { success: false, message: (error as Error).message };
    }
  };

  async function checkGameRunning(
    gamesConfig: GamesConfig
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

  function startGameDetection(settings: { gamesConfig: GamesConfig }) {
    let lastDetectedRecord: boolean | null = null;
    let lastDetectedGame: string | null = null;

    const interval = setInterval(async () => {
      const [currentGame, record] = await checkGameRunning(
        settings.gamesConfig
      );

      if (currentGame !== lastDetectedGame) {
        if (currentGame) {
          console.log(`${currentGame} detected! Starting OBS recording.`);
          try {
            await setOutputPathForGame(currentGame);
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

  async function setOutputPathForGame(gameName: string): Promise<boolean> {
    const GAMES_DIR = "E:/Clips";
    try {
      const gameDir = await join(GAMES_DIR, gameName);
      await mkdir(gameDir, { recursive: true });

      await obs.call("SetRecordDirectory", {
        recordDirectory: gameDir,
      });

      await obs.call("SetProfileParameter", {
        parameterCategory: "Output",
        parameterName: "FilenameFormatting",
        parameterValue: `${gameName}_%DD-%MM-%CCYY_%hh-%mm-%ss%`,
      });

      return true;
    } catch (error) {
      console.error("Error setting output path:", error);
      return false;
    }
  }

  async function setSceneForGame(gameName: string): Promise<void> {
    const response: OBSResponseTypes["GetSceneList"] = await obs.call(
      "GetSceneList"
    );
    const scenes = response.scenes;

    let sceneName = "Default";
    if (
      scenes &&
      scenes.some(
        (scene) =>
          typeof scene.sceneName === "string" &&
          scene.sceneName.includes(gameName)
      )
    ) {
      sceneName = gameName;
    }

    const request: OBSRequestTypes["SetCurrentProgramScene"] = {
      sceneName,
    };

    await obs.call("SetCurrentProgramScene", request);
  }

  const value: OBSContextValue = {
    connection,
    connect,
    obsSetting,
    setObsSetting,
    startGameDetection,
  };

  return <OBSContext.Provider value={value}>{children}</OBSContext.Provider>;
};

export const useOBS = (): OBSContextValue => {
  const context = useContext(OBSContext);
  if (!context) {
    throw new Error("useOBS must be used within an OBSProvider");
  }
  return context;
};

export default OBSContext;
