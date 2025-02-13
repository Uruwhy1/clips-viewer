import OBSWebSocket from "obs-websocket-js";
import { invoke } from "@tauri-apps/api/core";
import { mkdir } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import { window } from "@tauri-apps/api";

const obs = new OBSWebSocket();
let obsConnected = false;

export const connectOBS = async (host, password) => {
  try {
    await obs.connect(`ws://localhost:${host}`, password);
    obsConnected = true;
    return { connected: true, message: "Successfully connected to OBS" };
  } catch (error) {
    console.error("OBS Connection Error:", error);
    return { connected: false, message: error.message };
  }
};

export const startRecording = async (currentGame, record) => {
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

export const stopRecording = async (record) => {
  try {
    if (record) {
      const response = await obs.call("StopRecord");
    }
    const response2 = await obs.call("StopReplayBuffer");

    location.reload();
    let current = window.getCurrentWindow();
    current.show();

    return { success: true };
  } catch (error) {
    console.error("OBS Recording Stop Error:", error);
    return { success: false, message: error.message };
  }
};

export const checkOBSStatus = async () => {
  try {
    const version = await obs.call("GetVersion");
    return {
      connected: true,
      version: version.obsVersion,
      websocketVersion: version.obsWebSocketVersion,
    };
  } catch (error) {
    console.error("OBS Status Check Error:", error);
    return { connected: false, message: error.message };
  }
};

export async function checkGameRunning(gamesConfig) {
  if (!obsConnected) return [null, null];
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

export function startGameDetection(settings) {
  let lastDetectedRecord = null;
  let lastDetectedGame = null;

  setInterval(async () => {
    const [currentGame, record] = await checkGameRunning(
      settings.current.gamesConfig
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
