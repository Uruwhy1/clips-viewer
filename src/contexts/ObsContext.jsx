import { createContext, useState, useContext, useEffect, useRef } from "react";
import OBSWebSocket from "obs-websocket-js";
import { loadSettings } from "../helpers/settingsFile";
import { useSettings } from "./SettingsContext";
import { invoke } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";
import { mkdir } from "@tauri-apps/plugin-fs";
import { getCurrentWindow } from "@tauri-apps/api/window";

const OBSContext = createContext();

export const OBSProvider = ({ children }) => {
  const { settings, loadedSettings } = useSettings();
  const [obs] = useState(() => new OBSWebSocket());
  const [connection, setConnection] = useState({
    status: "disconnected",
    version: null,
    error: null,
  });
  const [obsSetting, setObsSetting] = useState({ port: null, password: null });

  let gameDetectionInterval = false;

  const clearGameDetectionInterval = () => {
    if (gameDetectionInterval) {
      clearInterval(gameDetectionInterval);
      gameDetectionInterval = null;
    }
  };

  useEffect(() => {
    const handleConnectionClosed = (data) => {
      console.log("OBS WebSocket disconnected:", data);

      clearGameDetectionInterval();

      setConnection({
        status: "disconnected",
        version: null,
        error: data?.message || "Connection closed",
      });
    };

    const handleConnectionError = (error) => {
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
      let loadedSettings = await loadSettings(null);
      setObsSetting(loadedSettings.obs);
    };
    start();
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        if (obsSetting && obsSetting.port && obsSetting.password) {
          await connect(obsSetting.port, obsSetting.password);
        }
      } catch (error) {
        console.error("Failed to initialize OBS context:", error);
      }
    };

    initialize();
  }, [obsSetting]);

  useEffect(() => {
    if (connection.status == "connected" && loadedSettings) {
      clearGameDetectionInterval();

      startGameDetection(settings);
    }
  }, [connection, settings]);

  const connect = async (port, password) => {
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
        error: error.message,
      });

      return false;
    }
  };

  const startRecording = async (currentGame, record) => {
    try {
      await setSceneForGame(currentGame);

      if (record) {
        const response = await obs.call("StartRecord");
      }
      const response2 = await obs.call("StartReplayBuffer");

      return { success: true };
    } catch (error) {
      console.error("OBS Recording Start Error:", error);
      return { success: false, message: error.message };
    }
  };

  const stopRecording = async (record) => {
    try {
      if (record) {
        const response = await obs.call("StopRecord");
      }
      const response2 = await obs.call("StopReplayBuffer");

      location.reload();
      await getCurrentWindow().show();

      return { success: true };
    } catch (error) {
      console.error("OBS Recording Stop Error:", error);
      return { success: false, message: error.message };
    }
  };

  async function checkGameRunning(gamesConfig) {
    if (connection.status !== "connected") return [null, null];
    try {
      const { running_processes } = await invoke("get_running_processes");

      const processGameMap = new Map();
      for (const [gameName, config] of Object.entries(gamesConfig)) {
        for (const processName of config.processes) {
          processGameMap.set(processName.toLowerCase(), [
            gameName,
            config.record,
          ]);
        }
      }

      for (const process of running_processes) {
        const gameInfo = processGameMap.get(process);
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

  function startGameDetection(settings) {
    let lastDetectedRecord = null;
    let lastDetectedGame = null;

    let interval = setInterval(async () => {
      const [currentGame, record] = await checkGameRunning(
        settings.gamesConfig
      );

      if (currentGame !== lastDetectedGame) {
        if (currentGame) {
          console.log(`${currentGame} detected! Starting OBS recording.`);
          try {
            await setOutputPathForGame(currentGame);
            await startRecording(currentGame, record);
            console.log(`Started recording for ${currentGame}`);
          } catch (error) {
            console.error("Failed to start recording:", error);
          }
        } else if (lastDetectedGame) {
          try {
            await stopRecording(lastDetectedRecord);
            console.log(`Stopped recording for ${lastDetectedGame}`);
          } catch (error) {
            console.error("Failed to stop recording:", error);
          }
        }

        lastDetectedGame = currentGame;
        lastDetectedRecord = record;
      }
    }, 2500);

    gameDetectionInterval = interval;

    return () => {
      clearInterval(interval);
    };
  }

  async function setOutputPathForGame(gameName) {
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

  async function setSceneForGame(gameName) {
    let scenes = (await obs.call("GetSceneList")).scenes;
    let sceneName = "Default";
    if (scenes.some((i) => i.sceneName.includes(gameName))) {
      sceneName = gameName;
    }
    await obs.call("SetCurrentProgramScene", {
      sceneName,
    });
  }

  const value = {
    connection,
    connect,
    obsSetting,
    setObsSetting,
    startGameDetection,
  };

  return <OBSContext.Provider value={value}>{children}</OBSContext.Provider>;
};

export const useOBS = () => {
  const context = useContext(OBSContext);
  if (!context) {
    throw new Error("useOBS must be used within an OBSProvider");
  }
  return context;
};

export default OBSContext;
