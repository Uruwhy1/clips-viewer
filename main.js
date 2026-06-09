const { app, protocol } = require("electron");
const path = require("path");

const { isDev } = require("./electron/config");
const { loadSettings } = require("./electron/settings");
const { createWindow } = require("./electron/window");
const { createTray, handleQuit } = require("./electron/tray");

require("./electron/ipc");

if (isDev) {
  require("electron-reload")(__dirname, {
    electron: path.join(__dirname, "node_modules", ".bin", "electron"),
  });
}

app.whenReady().then(async () => {
  protocol.registerFileProtocol("clips", (request, callback) => {
    const url = request.url.replace("clips://", "");
    try {
      callback(decodeURIComponent(url));
    } catch (err) {
      console.error("Failed to decode clips URL:", err);
    }
  });

  await loadSettings();
  createWindow();
  createTray();
});

app.on("window-all-closed", handleQuit);
app.on("activate", () => {
  const { getMainWindow } = require("./electron/window");
  getMainWindow()?.show();
});
