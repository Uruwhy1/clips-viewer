const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs").promises;

var isDev = process.env.APP_DEV ? process.env.APP_DEV.trim() == "true" : false;

if (isDev) {
  require("electron-reload")(__dirname, {
    electron: path.join(__dirname, "node_modules", ".bin", "electron"),
    ignored: /node_modules|[\/\\]\.|favourites.json/,
  });
}

const GAMES_DIR = "E:/Clips";

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1980,
    height: 1080,
    webPreferences: {
      sandbox: false,
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

const FAVOURITES_PATH = path.join(__dirname, "favourites.json");

async function loadFavourites() {
  try {
    const data = await fs.readFile(FAVOURITES_PATH, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveFavourites(favourites) {
  await fs.writeFile(FAVOURITES_PATH, JSON.stringify(favourites));
}

async function getAllClipsWithMetadata(dirPath) {
  const allClips = [];
  const favourites = await loadFavourites();

  try {
    const gameDirs = (await fs.readdir(dirPath)).filter(async (dir) => {
      const stat = await fs.stat(path.join(dirPath, dir));
      return stat.isDirectory();
    });

    for (const gameDir of gameDirs) {
      const gamePath = path.join(dirPath, gameDir);
      const clips = await getClipsFromDirectoryWithMetadata(
        gamePath,
        gameDir,
        favourites
      );
      allClips.push(...clips);
    }
  } catch (error) {
    console.error("Error reading clips directory:", error);
  }
  return allClips;
}

async function getClipsFromDirectoryWithMetadata(dirPath, game, favourites) {
  const clipFiles = [];
  try {
    const items = await fs.readdir(dirPath);
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const name = item.match(/[\sA-Za-z0-9]+/);
      try {
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) {
          const subClips = await getClipsFromDirectoryWithMetadata(
            fullPath,
            game,
            favourites
          );
          clipFiles.push(...subClips);
        } else if (
          stat.isFile() &&
          (item.endsWith(".mp4") || item.endsWith(".mkv"))
        ) {
          clipFiles.push({
            game,
            fileName: name || item,
            filePath: fullPath,
            date: stat.mtime,
            isFavourite: favourites.includes(fullPath),
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

ipcMain.handle("toggle-favourite", async (event, filePath) => {
  try {
    const favourites = await loadFavourites();
    const index = favourites.indexOf(filePath);

    if (index > -1) {
      favourites.splice(index, 1);
    } else {
      favourites.push(filePath);
    }

    await saveFavourites(favourites);
    return favourites;
  } catch (error) {
    console.error("Error toggling favourite:", error);
    return [];
  }
});
