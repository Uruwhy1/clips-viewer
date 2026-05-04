const { contextBridge, ipcRenderer, shell, dialog } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  getAllClips: () => ipcRenderer.invoke("get-all-clips"),
  onClipLoadingProgress: (callback) =>
    ipcRenderer.on("clip-loading-progress", (event, progress) => callback(progress)),
  removeClipLoadingProgressListener: () =>
    ipcRenderer.removeAllListeners("clip-loading-progress"),
  openFileExplorer: (filePath) => shell.showItemInFolder(filePath),
  toggleFavourite: (filePath) =>
    ipcRenderer.invoke("toggle-favourite", filePath),
  saveAllFavourites: (favourites) =>
    ipcRenderer.invoke("save-all-favourites", favourites),
  deleteClip: (filePath) => ipcRenderer.invoke("delete-clip", filePath),
  createClip: (options) => ipcRenderer.invoke("create-clip", options),
  renameClip: (oldPath, newName) =>
    ipcRenderer.invoke("rename-clip", oldPath, newName),

  onClipProgress: (callback) =>
    ipcRenderer.on("clip-progress", (event, progress) => callback(progress)),
  removeClipProgressListener: () =>
    ipcRenderer.removeAllListeners("clip-progress"),

connectOBS: (port, password) => ipcRenderer.invoke("connect-obs", port, password),

    startOBSRecording: (currentGame, record) =>
      ipcRenderer.invoke("start-obs-recording", currentGame, record),

    stopOBSRecording: (record) => ipcRenderer.invoke("stop-obs-recording", record),
  checkOBSStatus: () => ipcRenderer.invoke("check-obs-status"),
  scanForNewClips: (scanTimestamp, gameName) => ipcRenderer.invoke("scan-for-new-clips", scanTimestamp, gameName),
  getGameDetectionStatus: () => ipcRenderer.invoke("get-game-detection-status"),

  getSettings: () => ipcRenderer.invoke("get-settings"),
  saveSettings: (settings) => ipcRenderer.invoke("save-settings", settings),
  selectDirectory: () => ipcRenderer.invoke("select-directory"),
  selectFile: (filters) => ipcRenderer.invoke("select-file", filters),

  minimize: () => ipcRenderer.invoke("window-minimize"),
  maximize: () => ipcRenderer.invoke("window-maximize"),
  close: () => ipcRenderer.invoke("window-close"),

  onStartRecording: (callback) =>
    ipcRenderer.on("start-obs-recording", callback),
  onStopRecording: (callback) => ipcRenderer.on("stop-obs-recording", (event, data) => callback(data)),
  onNewClipsDetected: (callback) =>
    ipcRenderer.on("new-clips-detected", (event, clips) => callback(clips)),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});

