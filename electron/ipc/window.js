const { ipcMain, shell } = require("electron");
const { getMainWindow } = require("../window");

function register() {
  ipcMain.handle("show-in-folder", async (_event, filePath) => {
    shell.showItemInFolder(filePath);
  });

  ipcMain.handle("window-minimize", () => {
    getMainWindow()?.minimize();
  });

  ipcMain.handle("window-maximize", async () => {
    const win = getMainWindow();
    if (win?.isMaximized()) {
      win.unmaximize();
    } else {
      win?.maximize();
    }
  });

  ipcMain.handle("window-close", () => {
    getMainWindow()?.hide();
  });
}

module.exports = { register };
