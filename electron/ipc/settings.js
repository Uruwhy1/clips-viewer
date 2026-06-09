const { ipcMain, dialog } = require("electron");
const { getSettings, saveSettings } = require("../settings");
const { getMainWindow } = require("../window");

function register() {
  ipcMain.handle("get-settings", async () => {
    return getSettings();
  });

  ipcMain.handle("save-settings", async (_event, newSettings) => {
    return await saveSettings(newSettings);
  });

  ipcMain.handle("select-directory", async () => {
    const result = await dialog.showOpenDialog(getMainWindow(), {
      properties: ["openDirectory"],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle("select-file", async (_event, filters) => {
    const result = await dialog.showOpenDialog(getMainWindow(), {
      properties: ["openFile"],
      filters: filters || [],
    });
    return result.canceled ? null : result.filePaths[0];
  });
}

module.exports = { register };
