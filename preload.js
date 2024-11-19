const { contextBridge, ipcRenderer, shell } = require("electron");

// expose API to the renderer
contextBridge.exposeInMainWorld("electron", {
  getAllClips: () => ipcRenderer.invoke("get-all-clips"),
  openFileExplorer: (filePath) => shell.showItemInFolder(filePath),
  toggleFavourite: (filePath) =>
    ipcRenderer.invoke("toggle-favourite", filePath),
});

ipcRenderer.on("clip-played", (event, filePath) => {
  console.log(`Playing clip: ${filePath}`);
});
