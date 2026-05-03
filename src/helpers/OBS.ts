export async function connectOBS(
  port: string,
  password: string,
): Promise<{ success: boolean; version?: string; error?: string }> {
  try {
    const result = await window.electron.connectOBS(port, password);
    return { success: result.connected, version: result.message };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function setOutputPathForGame(
  gameName: string,
  gamesDir: string,
): Promise<boolean> {
  return true;
}

export async function setSceneForGame(gameName: string): Promise<void> {
  return;
}

export async function startOBSRecording(
  currentGame: string,
  record: boolean,
  recordingSoundEnabled: boolean,
  playSound: () => void,
): Promise<{ success: boolean; message?: string }> {
  console.log("[OBS Helper] startOBSRecording called", { currentGame, record, recordingSoundEnabled });
  try {
    const result = await window.electron.startOBSRecording(currentGame, record);
    console.log("[OBS Helper] startOBSRecording result:", result);
    if (recordingSoundEnabled && playSound) playSound();
    return result;
  } catch (error) {
    console.error("[OBS Helper] startOBSRecording error:", error);
    return { success: false, message: (error as Error).message };
  }
}

export async function stopOBSRecording(
  record: boolean,
): Promise<{ success: boolean; message?: string }> {
  console.log("[OBS Helper] stopOBSRecording called", { record });
  try {
    const result = await window.electron.stopOBSRecording(record);
    console.log("[OBS Helper] stopOBSRecording result:", result);
    return result;
  } catch (error) {
    console.error("[OBS Helper] stopOBSRecording error:", error);
    return { success: false, message: (error as Error).message };
  }
}
