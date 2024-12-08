import OBSWebSocket from "obs-websocket-js";
import { loadOBSConfig } from "./externalFiles";
import { invoke } from "@tauri-apps/api/core";
import { mkdir } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import { window } from "@tauri-apps/api";

const obs = new OBSWebSocket();

export const connectOBS = async () => {
  try {
    await obs.connect("ws://localhost:4455", "bolso02");
    return { connected: true, message: "Successfully connected to OBS" };
  } catch (error) {
    console.error("OBS Connection Error:", error);
    return { connected: false, message: error.message };
  }
};

export const startRecording = async (currentGame) => {
  try {
    await setSceneForGame(currentGame);

    const response = await obs.call("StartRecord");
    const response2 = await obs.call("StartReplayBuffer");
    return { success: true };
  } catch (error) {
    console.error("OBS Recording Start Error:", error);
    return { success: false, message: error.message };
  }
};

export const stopRecording = async () => {
  try {
    const response = await obs.call("StopRecord");
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

export async function checkGameRunning() {
  const gameProcesses = await loadOBSConfig();

  try {
    const runningProcesses = await invoke("get_running_processes");

    const runningProcessesLower = runningProcesses.toLowerCase();

    // Check each game in the config
    for (const [gameName, processNames] of Object.entries(gameProcesses)) {
      const isGameRunning = processNames.some((processName) =>
        runningProcessesLower.includes(processName.toLowerCase())
      );

      if (isGameRunning) {
        return gameName;
      }
    }

    return null;
  } catch (error) {
    console.error("Error checking running processes:", error);
    return null;
  }
}

export function startGameDetection() {
  let lastDetectedGame = null;

  setInterval(async () => {
    const currentGame = await checkGameRunning();

    if (currentGame && currentGame !== lastDetectedGame) {
      console.log(`${currentGame} detected! Starting OBS recording.`);

      try {
        await setOutputPathForGame(currentGame);
        startRecording(currentGame);

        console.log(`Started recording for ${currentGame}`);
      } catch (error) {
        console.error("Failed to start recording:", error);
      }

      lastDetectedGame = currentGame;
    } else if (!currentGame && lastDetectedGame) {
      try {
        stopRecording();
        console.log(`Stopped recording for ${lastDetectedGame}`);
      } catch (error) {
        console.error("Failed to stop recording:", error);
      }

      lastDetectedGame = null;
    }
  }, 5000);
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
