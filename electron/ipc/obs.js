const { ipcMain } = require("electron");
const obs = require("../obs");
const gameDetection = require("../gameDetection");
const { getSettings } = require("../settings");

function register() {
  ipcMain.handle("connect-obs", async (_event, port, password) => {
    try {
      await obs.connect(port, password);
      const { gamesDir, gamesConfig } = getSettings();
      gameDetection.start(gamesDir, gamesConfig);
      return { connected: true, message: "Connected to OBS" };
    } catch (error) {
      console.error("OBS Connection Error:", error);
      return { connected: false, message: error.message };
    }
  });

  ipcMain.handle("start-obs-recording", async () => {
    try {
      await obs.startRecording();
      return { success: true };
    } catch (error) {
      console.error("OBS Recording Start Error:", error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle("stop-obs-recording", async () => {
    try {
      await obs.stopRecording();
      return { success: true };
    } catch (error) {
      console.error("OBS Recording Stop Error:", error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle("check-obs-status", async () => {
    return await obs.checkStatus();
  });

  ipcMain.handle("get-game-detection-status", async () => {
    return gameDetection.getStatus();
  });
}

module.exports = { register };
