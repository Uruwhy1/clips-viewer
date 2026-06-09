const { ipcMain } = require("electron");
const clips = require("../clips");
const { getSettings } = require("../settings");
const { getMainWindow } = require("../window");
const path = require("path");

function register() {
  ipcMain.handle("get-all-clips", async () => {
    const gamesDir = getSettings().gamesDir;
    if (!gamesDir) return [];
    return await clips.getAllWithMetadata(gamesDir);
  });

  ipcMain.handle("delete-clip", async (_event, filePath) => {
    return await clips.deleteClipFile(filePath);
  });

  ipcMain.handle("get-clips-sizes", async (_event, filePaths) => {
    return await clips.getSizes(filePaths);
  });

  ipcMain.handle("create-clip", async (event, { inputFile, startTime, endTime, outputFile }) => {
    return await clips.createClip(inputFile, startTime, endTime, outputFile);
  });

  ipcMain.handle("rename-clip", async (_event, oldPath, newName) => {
    return await clips.renameClipFile(oldPath, newName);
  });

  ipcMain.handle("scan-for-new-clips", async (_event, scanTimestamp, gameName) => {
    const gamesDir = getSettings().gamesDir;
    if (!gamesDir) return [];
    const fullGameDir = path.join(gamesDir, gameName);
    console.log(`Scanning ${fullGameDir} for clips since ${scanTimestamp}`);
    const newClips = await clips.scanForNewClips(fullGameDir, gameName, scanTimestamp);
    console.log(`Found ${newClips.length} new clips`);
    if (newClips.length > 0) {
      getMainWindow()?.webContents.send("new-clips-detected", newClips);
    }
    return newClips;
  });
}

module.exports = { register };
