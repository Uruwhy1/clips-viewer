const { contextBridge, ipcRenderer } = require("electron");

// expose API to the renderer
contextBridge.exposeInMainWorld("electron", {
  getAllClips: () => ipcRenderer.invoke("get-all-clips"),
});

ipcRenderer.on("clip-played", (event, filePath) => {
  console.log(`Playing clip: ${filePath}`);
});
