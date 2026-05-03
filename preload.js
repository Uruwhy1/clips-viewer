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
  deleteClip: (filePath) => ipcRenderer.invoke("delete-clip", filePath),
  renameClip: (oldPath, newName) =>
    ipcRenderer.invoke("rename-clip", oldPath, newName),

connectOBS: (port, password) => ipcRenderer.invoke("connect-obs", port, password),

    startOBSRecording: (currentGame, record) =>
      ipcRenderer.invoke("start-obs-recording", currentGame, record),

    stopOBSRecording: (record) => ipcRenderer.invoke("stop-obs-recording", record),
  checkOBSStatus: () => ipcRenderer.invoke("check-obs-status"),

  getSettings: () => ipcRenderer.invoke("get-settings"),
  saveSettings: (settings) => ipcRenderer.invoke("save-settings", settings),
  selectDirectory: () => ipcRenderer.invoke("select-directory"),
  selectFile: (filters) => ipcRenderer.invoke("select-file", filters),

  minimize: () => ipcRenderer.invoke("window-minimize"),
  maximize: () => ipcRenderer.invoke("window-maximize"),
  close: () => ipcRenderer.invoke("window-close"),

  onStartRecording: (callback) =>
    ipcRenderer.on("start-obs-recording", callback),
  onStopRecording: (callback) => ipcRenderer.on("stop-obs-recording", callback),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});

