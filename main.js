const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs").promises;
const { exec } = require("child_process");

const OBSWebSocket = require("obs-websocket-js").OBSWebSocket;
const obs = new OBSWebSocket();
let obsConnected = false;

let mainWindow;

let isDev = process.env.APP_DEV ? process.env.APP_DEV.trim() == "true" : false;
if (isDev) {
  require("electron-reload")(__dirname, {
    electron: path.join(__dirname, "node_modules", ".bin", "electron"),
    ignored: /node_modules|[\/\\]\.|favourites.json/,
  });
}

const GAMES_DIR = "E:/Clips";
const GAME_PROCESSES = {
  "League of Legends": ["League of Legends.exe"],
  "Rocket League": ["RocketLeague.exe", "RocketLeague_DX11.exe"],
  "Football Manager": ["fm.exe", "FootballManager.exe"],
  "Crusader Kings II": ["ck2.exe", "CrusaderKings2.exe"],
};

function checkGameRunning() {
  return new Promise((resolve, reject) => {
    exec("tasklist", (err, stdout) => {
      if (err) {
        console.error("Error checking processes:", err);
        resolve(null);
        return;
      }

      const runningProcesses = stdout.toLowerCase();

      for (const [gameName, processNames] of Object.entries(GAME_PROCESSES)) {
        const gameRunning = processNames.some((process) =>
          runningProcesses.includes(process.toLowerCase())
        );

        if (gameRunning) {
          resolve(gameName);
          return;
        }
      }

      resolve(null);
    });
  });
}

function startGameDetection() {
  let lastDetectedGame = null;

  setInterval(async () => {
    const currentGame = await checkGameRunning();

    if (currentGame && currentGame !== lastDetectedGame) {
      console.log(`${currentGame} detected! Starting OBS recording.`);

      try {
        mainWindow.webContents.send("start-obs-recording");

        console.log(`Started recording for ${currentGame}`);
      } catch (error) {
        console.error("Failed to start recording:", error);
      }

      lastDetectedGame = currentGame;
    } else if (!currentGame && lastDetectedGame) {
      try {
        mainWindow.webContents.send("stop-obs-recording");
        console.log(`Stopped recording for ${lastDetectedGame}`);
      } catch (error) {
        console.error("Failed to stop recording:", error);
      }

      lastDetectedGame = null;
    }
  }, 10000);
}
function createWindow() {
  mainWindow = new BrowserWindow({
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
}

app.whenReady().then(async () => {
  createWindow();
  startGameDetection();
});

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

const FAVOURITES_PATH = "E:/Clips/favourites.json";

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
    const items = await fs.readdir(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);

      try {
        const stat = await fs.stat(fullPath);

        if (stat.isDirectory()) {
          const clips = await getClipsFromDirectoryWithMetadata(
            fullPath,
            item,
            favourites
          );
          allClips.push(...clips);
        }
      } catch (error) {
        console.warn(`Skipping item ${fullPath} due to error:`, error);
        continue;
      }
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
        console.warn(`Skipping item ${fullPath} due to error:`, error);
        continue;
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
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

ipcMain.handle("connect-obs", async () => {
  try {
    await obs.connect("ws://localhost:4455", "bolso02");
    return { connected: true, message: "Successfully connected to OBS" };
  } catch (error) {
    console.error("OBS Connection Error:", error);
    return { connected: false, message: error.message };
  }
});

ipcMain.handle("start-obs-recording", async () => {
  try {
    const response = await obs.call("StartRecord");
    const response2 = await obs.call("StartReplayBuffer");
    return { success: true };
  } catch (error) {
    console.error("OBS Recording Start Error:", error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle("stop-obs-recording", async () => {
  try {
    const response = await obs.call("StopRecord");
    const response2 = await obs.call("StopReplayBuffer");
    return { success: true };
  } catch (error) {
    console.error("OBS Recording Stop Error:", error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle("check-obs-status", async () => {
  try {
    const version = await obs.call("GetVersion");
    return {
      connected: true,
      version: version.obsVersion,
      websocketVersion: version.obsWebSocketVersion,
    };
  } catch (error) {
    console.error("OBS Status Check Error:", error);
    return { connected: false, message: error.message };
  }
});
