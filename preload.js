const { contextBridge, ipcRenderer, shell } = require("electron");

// expose API to the renderer
contextBridge.exposeInMainWorld("electron", {
  getAllClips: () => ipcRenderer.invoke("get-all-clips"),
  openFileExplorer: (filePath) => shell.showItemInFolder(filePath),
});

ipcRenderer.on("clip-played", (event, filePath) => {
  console.log(`Playing clip: ${filePath}`);
});
