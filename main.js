const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs").promises;

var isDev = process.env.APP_DEV ? process.env.APP_DEV.trim() == "true" : false;

if (isDev) {
  require("electron-reload")(__dirname, {
    electron: path.join(__dirname, "node_modules", ".bin", "electron"),
    ignored: /node_modules|[\/\\]\./,
  });
}

const GAMES_DIR = "E:/Clips";

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1980,
    height: 1080,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadFile("index.html");
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

async function getAllClipsWithMetadata(dirPath) {
  const allClips = [];

  try {
    const gameDirs = (await fs.readdir(dirPath)).filter(async (dir) => {
      const stat = await fs.stat(path.join(dirPath, dir));
      return stat.isDirectory();
    });

    for (const gameDir of gameDirs) {
      const gamePath = path.join(dirPath, gameDir);
      const clips = await getClipsFromDirectoryWithMetadata(gamePath, gameDir);
      allClips.push(...clips);
    }
  } catch (error) {
    console.error("Error reading clips directory:", error);
  }

  return allClips;
}

async function getClipsFromDirectoryWithMetadata(dirPath, game) {
  const clipFiles = [];
  try {
    const items = await fs.readdir(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);

      try {
        const stat = await fs.stat(fullPath);

        if (stat.isDirectory()) {
          const subClips = await getClipsFromDirectoryWithMetadata(
            fullPath,
            game
          );
          clipFiles.push(...subClips);
        } else if (stat.isFile() && item.endsWith(".mp4")) {
          clipFiles.push({
            game,
            fileName: item,
            filePath: fullPath,
            date: stat.mtime,
          });
        }
      } catch (error) {
        console.error(`Error accessing ${fullPath}:`, error);
        continue;
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
    throw error;
  }

  return clipFiles;
}

ipcMain.handle("get-all-clips", async () => {
  try {
    const allClips = await getAllClipsWithMetadata(GAMES_DIR);
    return allClips;
  } catch (error) {
    console.error("Error loading clips:", error);
    return [];
  }
});
