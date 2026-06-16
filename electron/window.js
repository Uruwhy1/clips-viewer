const { BrowserWindow } = require("electron");
const path = require("path");
const { isDev } = require("./config");

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1980,
    height: 1080,
    webPreferences: {
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      devTools: true,
      preload: path.join(__dirname, "..", "preload.js"),
    },
    titleBarStyle: 'hidden'
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  mainWindow.on("minimize", () => {
    mainWindow.hide();
  });
}

function getMainWindow() {
  return mainWindow;
}

module.exports = { createWindow, getMainWindow };
