const { Tray, Menu, app } = require("electron");
const { getAssetPath } = require("./config");
const { getMainWindow } = require("./window");

let tray = null;

function createTray() {
  const iconPath = getAssetPath("icon.png");
  try {
    tray = new Tray(iconPath);
    const contextMenu = Menu.buildFromTemplate([
      { label: "Show", click: () => getMainWindow()?.show() },
      { label: "Quit", type: "normal", click: handleQuit },
    ]);
    tray.setToolTip("Clips Viewer");
    tray.setContextMenu(contextMenu);
    tray.addListener("click", () => getMainWindow()?.show());
  } catch (error) {
    console.error("Error creating tray:", error);
  }
}

function handleQuit() {
  if (process.platform !== "darwin") {
    app.quit();
  }
}

module.exports = { createTray, handleQuit };
