const { contextBridge, ipcRenderer, shell } = require("electron");

// expose API to the renderer
contextBridge.exposeInMainWorld("electron", {
  getAllClips: () => ipcRenderer.invoke("get-all-clips"),
  openFileExplorer: (filePath) => shell.showItemInFolder(filePath),
  toggleFavourite: (filePath) =>
    ipcRenderer.invoke("toggle-favourite", filePath),

  connectOBS: () => ipcRenderer.invoke("connect-obs"),
  startOBSRecording: () => ipcRenderer.invoke("start-obs-recording"),
  stopOBSRecording: () => ipcRenderer.invoke("stop-obs-recording"),
  checkOBSStatus: () => ipcRenderer.invoke("check-obs-status"),
});

// handle sent events
ipcRenderer.on("start-obs-recording", async () => {
  try {
    const result = await ipcRenderer.invoke("start-obs-recording");
    if (result.success) {
      console.log("Recording started successfully.");
    } else {
      console.error("Failed to start recording:", result.message);
    }
  } catch (error) {
    console.error("Error starting recording:", error);
  }
});

ipcRenderer.on("stop-obs-recording", async () => {
  try {
    const result = await ipcRenderer.invoke("stop-obs-recording");
    if (result.success) {
      console.log("Recording stopped successfully.");
    } else {
      console.error("Failed to stop recording:", result.message);
    }
  } catch (error) {
    console.error("Error stopping recording:", error);
  }
});
