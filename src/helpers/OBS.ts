import OBSWebSocket, {
  OBSRequestTypes,
  OBSResponseTypes,
} from "obs-websocket-js";
import { mkdir } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";

export const obs = new OBSWebSocket();

export async function connectOBS(
  port: string,
  password: string
): Promise<{ success: boolean; version?: string; error?: string }> {
  try {
    await obs.connect(`ws://localhost:${port}`, password);
    const version = await obs.call("GetVersion");
    return { success: true, version: version.obsVersion };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function setOutputPathForGame(
  gameName: string,
  GAMES_DIR: string
): Promise<boolean> {
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

export async function setSceneForGame(gameName: string): Promise<void> {
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

export async function startOBSRecording(
  currentGame: string,
  record: boolean,
  recordingSoundEnabled: boolean,
  playSound: () => void
): Promise<{ success: boolean; message?: string }> {
  try {
    await setSceneForGame(currentGame);

    if (record) {
      await obs.call("StartRecord");
    }
    await obs.call("StartReplayBuffer");

    if (recordingSoundEnabled) playSound();

    return { success: true };
  } catch (error) {
    console.error("OBS Recording Start Error:", error);
    return { success: false, message: (error as Error).message };
  }
}

export async function stopOBSRecording(
  record: boolean
): Promise<{ success: boolean; message?: string }> {
  try {
    if (record) {
      await obs.call("StopRecord");
    }
    await obs.call("StopReplayBuffer");

    return { success: true };
  } catch (error) {
    console.error("OBS Recording Stop Error:", error);
    return { success: false, message: (error as Error).message };
  }
}
