const {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  dialog,
  shell,
  protocol,
} = require("electron");
const path = require("path");
const fs = require("fs").promises;
const { exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

const OBSWebSocket = require("obs-websocket-js").OBSWebSocket;
const obs = new OBSWebSocket();

let mainWindow;
let tray = null;

let isDev = process.env.DEV ? process.env.DEV.trim() == "true" : false;
if (isDev) {
  require("electron-reload")(__dirname, {
    electron: path.join(__dirname, "node_modules", ".bin", "electron"),
  });
}

function getAssetPath(asset) {
  if (isDev) {
    return path.join(__dirname, "assets", asset);
  } else {
    return path.join(process.resourcesPath, "assets", asset);
  }
}

const CONFIG_PATH = path.join(app.getPath("userData"), "settings.json");
const FAVOURITES_PATH = path.join(app.getPath("userData"), "favourites.json");
const CLIP_META_DIR = path.join(app.getPath("userData"), "clip-meta");
const THUMBNAIL_CACHE_DIR = path.join(app.getPath("userData"), "thumbnails");

const DEFAULT_SETTINGS = {
  gamesDir: "",
  gamesConfig: {},
  scrollbarOff: false,
  borderRadiusOff: false,
  clipsDeleteThreshold: 0,
  clipDeletion: false,
  obs: {},
  theme: "System (Catppuccin)",
  accentVariable: "--blue",
  recordingSoundEnabled: false,
  recordingMethod: "obs",
};

let GAME_PROCESSES = null;
let settings = DEFAULT_SETTINGS;
let gameDetectionInterval = null;
let preRecordingTimestamp = null;
let recordingGame = null;

// In-memory duration cache to avoid redundant ffprobe calls within a session
const durationCache = new Map();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fileKey(filePath) {
  return Buffer.from(filePath).toString("base64url");
}

function formatDate(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Parse date from filename - flexible regex like Tauri branch
// Returns unix timestamp or null if not found
function parseDateFromFilename(filename) {
  const match = filename.match(
    /_([\d]{2}-[\d]{2}-[\d]{4})_([\d]{2}-[\d]{2}-[\d]{2})/,
  );
  if (!match) {
    const dateOnly = filename.match(/_([\d]{2}-[\d]{2}-[\d]{4})\.mp4$/);
    if (!dateOnly) return null;
    const parts = dateOnly[1].split("-");
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return null;
    return Math.floor(date.getTime() / 1000);
  }

  const dateParts = match[1].split("-");
  const timeParts = match[2].split("-");

  const day = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10);
  const year = parseInt(dateParts[2], 10);
  const hour = parseInt(timeParts[0], 10);
  const minute = parseInt(timeParts[1], 10);
  const second = parseInt(timeParts[2], 10);

  const date = new Date(year, month - 1, day, hour, minute, second);
  if (isNaN(date.getTime())) return null;

  return Math.floor(date.getTime() / 1000);
}

// ─── Settings ─────────────────────────────────────────────────────────────────

async function loadSettings() {
  try {
    const exists = await fs
      .access(CONFIG_PATH)
      .then(() => true)
      .catch(() => false);
    if (!exists) {
      await fs.writeFile(
        CONFIG_PATH,
        JSON.stringify(DEFAULT_SETTINGS, null, 2),
      );
      return DEFAULT_SETTINGS;
    }
    const data = await fs.readFile(CONFIG_PATH, "utf8");
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch (error) {
    console.error("Error loading settings:", error);
    return DEFAULT_SETTINGS;
  }
}

async function saveSettings(newSettings) {
  try {
    settings = { ...settings, ...newSettings };
    await fs.writeFile(CONFIG_PATH, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error("Error saving settings:", error);
    return false;
  }
}

// ─── Per-file Clip Metadata ───────────────────────────────────────────────────

async function ensureClipMetaDir() {
  await fs.mkdir(CLIP_META_DIR, { recursive: true });
}

function clipMetaPath(filePath) {
  return path.join(CLIP_META_DIR, `${fileKey(filePath)}.json`);
}

async function loadClipMeta(filePath) {
  try {
    const data = await fs.readFile(clipMetaPath(filePath), "utf8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function saveClipMeta(filePath, meta) {
  await ensureClipMetaDir();
  await fs.writeFile(clipMetaPath(filePath), JSON.stringify(meta, null, 2));
}

async function deleteClipMeta(filePath) {
  try {
    await fs.unlink(clipMetaPath(filePath));
  } catch {}
}

async function renameClipMeta(oldPath, newPath) {
  try {
    await fs.rename(clipMetaPath(oldPath), clipMetaPath(newPath));
  } catch {}
}

// ─── Thumbnails ───────────────────────────────────────────────────────────────

async function ensureThumbnailDir() {
  await fs.mkdir(THUMBNAIL_CACHE_DIR, { recursive: true });
}

function thumbnailPath(filePath) {
  return path.join(THUMBNAIL_CACHE_DIR, `${fileKey(filePath)}.jpg`);
}

async function generateThumbnail(filePath) {
  await ensureThumbnailDir();
  const thumbPath = thumbnailPath(filePath);

  try {
    await fs.access(thumbPath);
    return thumbPath; // Already cached
  } catch {
    return new Promise((resolve) => {
      // Try seeking to 5s in, fall back to first frame if video is shorter
      exec(
        `ffmpeg -ss 5 -i "${filePath}" -vframes 1 -q:v 3 "${thumbPath}" -y 2>/dev/null || ` +
          `ffmpeg -i "${filePath}" -vframes 1 -q:v 3 "${thumbPath}" -y`,
        (err) => resolve(err ? "" : thumbPath),
      );
    });
  }
}

async function deleteThumbnail(filePath) {
  try {
    await fs.unlink(thumbnailPath(filePath));
  } catch {
    // Thumbnail may not exist, ignore
  }
}

// ─── Duration ─────────────────────────────────────────────────────────────────

function getVideoDuration(filePath) {
  if (durationCache.has(filePath)) {
    return Promise.resolve(durationCache.get(filePath));
  }
  return new Promise((resolve) => {
    exec(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
      (err, stdout) => {
        const duration = err ? 0 : parseFloat(stdout.trim()) || 0;
        durationCache.set(filePath, duration);
        resolve(duration);
      },
    );
  });
}

// ─── Game Config ──────────────────────────────────────────────────────────────

async function loadGameConfig() {
  if (!settings.gamesConfig) {
    settings.gamesConfig = DEFAULT_SETTINGS.gamesConfig;
  }
  return settings.gamesConfig;
}

async function setOutputPathForGame(gameName) {
  if (!settings.gamesDir) return false;
  try {
    const gameDir = path.join(settings.gamesDir, gameName);
    await fs.mkdir(gameDir, { recursive: true });

    await obs.call("SetRecordDirectory", { recordDirectory: gameDir });
    await obs.call("SetProfileParameter", {
      parameterCategory: "Output",
      parameterName: "FilenameFormatting",
      parameterValue: `${gameName}_%DD-%MM-%CCYY_%hh-%mm-%ss%`,
    });
    return true;
  } catch (error) {
    console.error("Error setting output path:", error.message);
    return false;
  }
}

// ─── Process Detection ────────────────────────────────────────────────────────

function getRunningProcesses() {
  return new Promise(async (resolve, reject) => {
    if (process.platform === "win32") {
      exec("tasklist", (err, stdout) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(stdout.toLowerCase());
      });
    } else {
      try {
        const procs = [];
        const procDir = await fs.readdir("/proc");
        for (const p of procDir) {
          if (/^\d+$/.test(p)) {
            try {
              const cmdline = await fs.readFile(
                path.join("/proc", p, "cmdline"),
                "utf8",
              );
              if (cmdline)
                procs.push(cmdline.toLowerCase().replace(/\0/g, " "));
            } catch (e) {}
          }
        }
        resolve(procs.join("\n"));
      } catch (e) {
        reject(e);
      }
    }
  });
}

async function checkGameRunning() {
  if (!GAME_PROCESSES) {
    GAME_PROCESSES = await loadGameConfig();
  }

  try {
    const runningProcesses = await getRunningProcesses();
    for (const [gameName, config] of Object.entries(GAME_PROCESSES)) {
      const gameRunning = config.processes.some((p) =>
        runningProcesses.includes(p.toLowerCase()),
      );
      if (gameRunning) return gameName;
    }
  } catch (error) {
    console.error("Error checking processes:", error);
  }
  return null;
}

async function switchToScene(sceneName) {
  try {
    const sceneList = await obs.call("GetSceneList");
    const sceneExists = sceneList.scenes.some(
      (scene) => scene.sceneName === sceneName,
    );
    if (sceneExists) {
      await obs.call("SetCurrentProgramScene", { sceneName });
      console.log(`Switched to scene: ${sceneName}`);
      return true;
    }
    return false;
  } catch (error) {
    try {
      const sceneList = await obs.call("GetSceneList");
      const sceneExists = sceneList.scenes.some(
        (scene) => scene.sceneName === sceneName,
      );
      if (sceneExists) {
        await obs.call("SetCurrentScene", { sceneName });
        console.log(`Switched to scene: ${sceneName}`);
        return true;
      }
    } catch (fallbackError) {
      console.error("Failed to switch scene:", fallbackError.message);
    }
    return false;
  }
}

async function getActiveWindowTitle() {
  try {
    if (process.platform === "win32") {
      const { stdout } = await execAsync(
        `powershell -command "` +
          `Add-Type @'\n` +
          `using System;using System.Runtime.InteropServices;\n` +
          `public class Win32{\n` +
          `  [DllImport(\\"user32.dll\\")] public static extern IntPtr GetForegroundWindow();\n` +
          `  [DllImport(\\"user32.dll\\")] public static extern int GetWindowText(IntPtr h, System.Text.StringBuilder s, int c);\n` +
          `}\n` +
          `'@;\n` +
          `$h=[Win32]::GetForegroundWindow();\n` +
          `$s=New-Object System.Text.StringBuilder 256;\n` +
          `[Win32]::GetWindowText($h,$s,256);\n` +
          `$s.ToString()"`,
      );
      return stdout.trim();
    } else {
      const { stdout } = await execAsync(
        "xdotool getactivewindow getwindowname 2>/dev/null",
      );
      return stdout.trim();
    }
  } catch {
    return null;
  }
}

async function isGameWindowFocused(gameName) {
  const config = GAME_PROCESSES?.[gameName];
  const matchTitles = config?.windowTitles && config.windowTitles.length > 0
    ? config.windowTitles
    : [gameName];

  const title = await getActiveWindowTitle();
  if (!title) return false;

  return matchTitles.some((matchTitle) =>
    title.toLowerCase().includes(matchTitle.toLowerCase())
  );
}

function startGameDetection() {
  if (gameDetectionInterval) return;
  let lastDetectedGame = null;
  gameDetectionInterval = setInterval(async () => {
    if (!GAME_PROCESSES) {
      GAME_PROCESSES = settings.gamesConfig;
    }

    const currentGame = await checkGameRunning();
    if (currentGame && currentGame !== lastDetectedGame) {
      if (!(await isGameWindowFocused(currentGame))) return;

      preRecordingTimestamp = Date.now();
      recordingGame = currentGame;
      console.log(`Recording started for ${currentGame} at ${preRecordingTimestamp}`);

      try {
        await setOutputPathForGame(currentGame);
        await switchToScene(currentGame);
        mainWindow?.webContents.send("start-obs-recording");
      } catch (error) {
        console.error("Failed to start recording:", error);
      }
      lastDetectedGame = currentGame;
    } else if (currentGame && currentGame === lastDetectedGame) {
      await switchToScene(currentGame);
    } else if (!currentGame && lastDetectedGame) {
      const stoppedGame = lastDetectedGame;
      const scanTimestamp = preRecordingTimestamp;
      lastDetectedGame = null;
      preRecordingTimestamp = null;

      console.log(`Game ${stoppedGame} ended. Stopping recording and scanning for new clips...`);

      try {
        mainWindow?.webContents.send("stop-obs-recording", { scanTimestamp, game: stoppedGame });
      } catch (error) {
        console.error("Failed to stop recording:", error);
      }
    }
  }, 10000);
}

// ─── Clips ────────────────────────────────────────────────────────────────────

async function getAllClipsWithMetadata(dirPath, totalGames = 0, sendProgress) {
  if (!dirPath) return [];
  const allClips = [];
  const favourites = await loadFavourites();

  let processedGames = 0;

  try {
    const items = await fs.readdir(dirPath);
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      try {
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) {
          processedGames++;

          // Count items in this game directory for progress
          let gameItemsCount = 0;
          try {
            const gameItems = await fs.readdir(fullPath);
            gameItemsCount = gameItems.filter(async (f) => {
              try {
                const s = await fs.stat(path.join(fullPath, f));
                return s.isFile() && (f.endsWith(".mp4") || f.endsWith(".mkv"));
              } catch {
                return false;
              }
            }).length;
          } catch {}

          // Track processed items for progress
          let itemsProcessed = 0;

          // Send progress update
          mainWindow.webContents.send("clip-loading-progress", {
            current: processedGames,
            total: totalGames,
            game: item,
            itemsTotal: gameItemsCount,
            itemsProcessed: 0,
          });

          const clips = await getClipsFromDirectoryWithMetadata(
            fullPath,
            item,
            favourites,
            0,
            gameItemsCount,
          );
          allClips.push(...clips);
        }
      } catch (error) {
        console.warn(`Skipping ${fullPath}:`, error);
      }
    }
  } catch (error) {
    console.error("Error reading clips directory:", error);
  }

  return allClips;
}

async function getClipsFromDirectoryWithMetadata(
  dirPath,
  game,
  favourites,
  processedCount = 0,
  totalItems = 0,
) {
  const clipFiles = [];
  let itemsProcessed = processedCount;
  try {
    const items = await fs.readdir(dirPath);
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const name = item.match(/[\sA-Za-z0-9]+/)?.[0] || item;
      try {
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) {
          const subClips = await getClipsFromDirectoryWithMetadata(
            fullPath,
            game,
            favourites,
          );
          clipFiles.push(...subClips);
        } else if (
          stat.isFile() &&
          (item.endsWith(".mp4") || item.endsWith(".mkv"))
        ) {
          itemsProcessed++;

          // Send progress update with item count
          mainWindow.webContents.send("clip-loading-progress", {
            current: 1, // game index - will be set by caller
            total: 1, // total games - will be set by caller
            game: game,
            itemsTotal: totalItems,
            itemsProcessed: itemsProcessed,
          });

          const fileDate = Math.floor(stat.mtime.getTime() / 1000);

          // Parse date from filename (e.g., "name_2026-04-26_14-30.mp4")
          const parsedDate = parseDateFromFilename(item);
          // Use parsed date if found, otherwise fall back to file stat mtime
          const effectiveDate = parsedDate || fileDate;

          const meta = await loadClipMeta(fullPath);

          // Use cached duration if the file hasn't changed, otherwise re-probe
          let duration;
          if (meta?.date === effectiveDate) {
            duration = meta.duration;
            durationCache.set(fullPath, duration); // Warm in-memory cache
          } else {
            duration = await getVideoDuration(fullPath);
            await saveClipMeta(fullPath, { date: effectiveDate, duration });
          }

          const thumbnail = await generateThumbnail(fullPath);

          clipFiles.push({
            game,
            name: name,
            filePath: fullPath,
            mediaPath: `clips://${encodeURIComponent(fullPath)}`,
            date: effectiveDate,
            formattedDate: formatDate(effectiveDate),
            isFavourite: favourites.includes(fullPath),
            thumbnail: `clips://${encodeURIComponent(thumbnail)}`,
            videoDuration: duration,
          });
        }
      } catch (error) {
        console.warn(`Skipping ${fullPath}:`, error);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }
  return clipFiles;
}

// ─── Window ───────────────────────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1980,
    height: 1080,
    webPreferences: {
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      devTools: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "dist", "index.html"));
  }

  mainWindow.on("minimize", () => {
    mainWindow.hide();
  });
}

function handleQuit() {
  if (process.platform !== "darwin") {
    app.quit();
  }
}

// ─── App Lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  protocol.registerFileProtocol("clips", (request, callback) => {
    const url = request.url.replace("clips://", "");
    try {
      const decoded = decodeURIComponent(url);
      callback(decoded);
    } catch (err) {
      console.error("Failed to decode clips URL:", err);
    }
  });

  settings = await loadSettings();
  createWindow();

  const iconPath = getAssetPath("icon.png");
  try {
    tray = new Tray(iconPath);
    const contextMenu = Menu.buildFromTemplate([
      { label: "Show", click: () => mainWindow.show() },
      { label: "Quit", type: "normal", click: handleQuit },
    ]);
    tray.setToolTip("Clips Viewer");
    tray.setContextMenu(contextMenu);
    tray.addListener("click", () => mainWindow.show());
  } catch (error) {
    console.error("Error creating tray:", error);
  }
});

app.on("window-all-closed", handleQuit);
app.on("activate", () => mainWindow.show());

// ─── Favourites ───────────────────────────────────────────────────────────────

async function loadFavourites() {
  try {
    const data = await fs.readFile(FAVOURITES_PATH, "utf8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveFavourites(favourites) {
  await fs.writeFile(FAVOURITES_PATH, JSON.stringify(favourites));
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

ipcMain.handle("get-all-clips", async () => {
  const gamesDir = settings.gamesDir;
  if (!gamesDir) return [];

  // Count game directories first for progress tracking
  let gameCount = 0;
  try {
    const items = await fs.readdir(gamesDir);
    for (const item of items) {
      const fullPath = path.join(gamesDir, item);
      try {
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) gameCount++;
      } catch (e) {}
    }
  } catch (e) {}

  const allClips = await getAllClipsWithMetadata(gamesDir, gameCount);
  return allClips.sort((a, b) => b.date - a.date);
});

ipcMain.handle("toggle-favourite", async (event, filePath) => {
  try {
    let favourites = await loadFavourites();
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

ipcMain.handle("save-all-favourites", async (event, favouritesArray) => {
  try {
    await saveFavourites(favouritesArray);
    return true;
  } catch (error) {
    console.error("Error saving all favourites:", error);
    return false;
  }
});

ipcMain.handle("delete-clip", async (event, filePath) => {
  try {
    await fs.unlink(filePath);
    await deleteClipMeta(filePath);
    await deleteThumbnail(filePath);
    durationCache.delete(filePath);
    return true;
  } catch (error) {
    console.error("Error deleting clip:", error);
    return false;
  }
});

ipcMain.handle("create-clip", async (event, { inputFile, startTime, endTime, outputFile }) => {
  try {
    // Parse times to calculate duration
    const startSeconds = parseTimeToSeconds(startTime);
    const endSeconds = parseTimeToSeconds(endTime);
    const totalDuration = endSeconds - startSeconds;

    const command = `ffmpeg -ss ${startTime} -to ${endTime} -i "${inputFile}" -c copy -movflags +faststart "${outputFile}" -y`;

    await new Promise((resolve, reject) => {
      const child = exec(command, { windowsHide: true }, (error) => {
        if (error) reject(error);
        else resolve();
      });

      // Progress tracking via stderr
      const progressInterval = setInterval(() => {
        try {
          const progressData = { totalDuration, startSeconds };
          event.sender.send("clip-progress", progressData);
        } catch (e) {
          // Ignore progress errors
        }
      }, 500);

      child.on("close", () => {
        clearInterval(progressInterval);
      });
    });

    // Generate thumbnail for the new clip
    await generateThumbnail(outputFile);

    // Get video duration
    const duration = await getVideoDuration(outputFile);

    // Get file stats for date
    const stats = await fs.stat(outputFile);
    const formattedDate = formatDate(stats.mtimeMs);

    return {
      success: true,
      path: outputFile,
      duration,
      formattedDate,
    };
  } catch (error) {
    console.error("Error creating clip:", error);
    return { success: false, error: error.message };
  }
});

function parseTimeToSeconds(timeStr) {
  const parts = timeStr.split(":");
  if (parts.length === 3) {
    return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  } else if (parts.length === 2) {
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return 0;
}

ipcMain.handle("rename-clip", async (event, oldPath, newName) => {
  try {
    const dir = path.dirname(oldPath);
    const oldFileName = path.basename(oldPath);
    const ext = path.extname(oldPath);

    // Format: Title_DATE_TIME.mp4
    const dateMatch = oldFileName.match(
      /^(.+?)_([\d-]+_[\d-]+(?:\.?\d*)?)\.mp4$/,
    );

    const dateTimePart = dateMatch?.[2] || "";
    const newFileName = dateTimePart
      ? `${newName}_${dateTimePart}${ext}`
      : `${newName}${ext}`;
    const newPath = path.join(dir, newFileName);

    await fs.rename(oldPath, newPath);

    await renameClipMeta(oldPath, newPath);
    if (durationCache.has(oldPath)) {
      durationCache.set(newPath, durationCache.get(oldPath));
      durationCache.delete(oldPath);
    }
    await deleteThumbnail(oldPath);

    return { newPath, newName: newName };
  } catch (error) {
    console.error("Error renaming clip:", error);
    return null;
  }
});

ipcMain.handle("connect-obs", async (event, port, password) => {
  try {
    await obs.connect(`ws://localhost:${port}`, password);
    startGameDetection();
    return { connected: true, message: "Connected to OBS" };
  } catch (error) {
    console.error("OBS Connection Error:", error);
    return { connected: false, message: error.message };
  }
});

ipcMain.handle("start-obs-recording", async (event, currentGame, record) => {
  console.log("[IPC] start-obs-recording called");
  try {
    console.log("[IPC] Calling StartRecord...");
    await obs.call("StartRecord");
    console.log("[IPC] StartRecord successful");
    console.log("[IPC] Calling StartReplayBuffer...");
    await obs.call("StartReplayBuffer");
    console.log("[IPC] StartReplayBuffer successful");
    return { success: true };
  } catch (error) {
    console.error("[IPC] OBS Recording Start Error:", error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle("stop-obs-recording", async (event, record) => {
  console.log("[IPC] stop-obs-recording called");
  try {
    console.log("[IPC] Calling StopRecord...");
    await obs.call("StopRecord");
    console.log("[IPC] StopRecord successful");
    console.log("[IPC] Calling StopReplayBuffer...");
    await obs.call("StopReplayBuffer");
    console.log("[IPC] StopReplayBuffer successful");
    return { success: true };
  } catch (error) {
    console.error("[IPC] OBS Recording Stop Error:", error);
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
    return { connected: false, message: error.message };
  }
});

ipcMain.handle("get-game-detection-status", async () => {
  return { running: gameDetectionInterval !== null };
});

ipcMain.handle("get-settings", async () => {
  return settings;
});

ipcMain.handle("save-settings", async (event, newSettings) => {
  return await saveSettings(newSettings);
});

ipcMain.handle("select-directory", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle("select-file", async (event, filters) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: filters || [],
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle("show-in-folder", async (event, filePath) => {
  shell.showItemInFolder(filePath);
});

ipcMain.handle("window-minimize", () => {
  mainWindow?.minimize();
});

ipcMain.handle("window-maximize", async () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle("window-close", () => {
  mainWindow?.hide();
});

async function scanForNewClips(gameDir, gameName, sinceTimestamp, favourites) {
  if (!gameDir) return [];
  const newClips = [];
  const sinceMs = sinceTimestamp || 0;

  try {
    const items = await fs.readdir(gameDir);
    for (const item of items) {
      const fullPath = path.join(gameDir, item);
      try {
        const stat = await fs.stat(fullPath);
        if (stat.isFile() && (item.endsWith(".mp4") || item.endsWith(".mkv"))) {
          const fileAgeMs = stat.mtimeMs - sinceMs;
          if (fileAgeMs > 5000) {
            const name = item.match(/[\sA-Za-z0-9]+/)?.[0] || item;
            const parsedDate = parseDateFromFilename(item);
            const effectiveDate = parsedDate || Math.floor(stat.mtime.getTime() / 1000);
            const thumbnail = await generateThumbnail(fullPath);

            let duration;
            const meta = await loadClipMeta(fullPath);
            if (meta?.date === effectiveDate) {
              duration = meta.duration;
              durationCache.set(fullPath, duration);
            } else {
              duration = await getVideoDuration(fullPath);
              await saveClipMeta(fullPath, { date: effectiveDate, duration });
            }

            newClips.push({
              game: gameName,
              name: name,
              filePath: fullPath,
              mediaPath: `clips://${encodeURIComponent(fullPath)}`,
              date: effectiveDate,
              formattedDate: formatDate(effectiveDate),
              isFavourite: favourites.includes(fullPath),
              thumbnail: `clips://${encodeURIComponent(thumbnail)}`,
              videoDuration: duration,
              newClip: true,
            });
            console.log(`Found new clip: ${item}`);
          }
        }
      } catch (error) {
        console.warn(`Skipping ${fullPath}:`, error);
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${gameDir}:`, error);
  }

  return newClips;
}

ipcMain.handle("scan-for-new-clips", async (event, scanTimestamp, gameName) => {
  const gameDir = settings.gamesDir;
  if (!gameDir) return [];

  const fullGameDir = path.join(gameDir, gameName);
  const favourites = await loadFavourites();

  console.log(`Scanning ${fullGameDir} for clips since ${scanTimestamp}`);
  const newClips = await scanForNewClips(fullGameDir, gameName, scanTimestamp, favourites);
  console.log(`Found ${newClips.length} new clips`);

  if (newClips.length > 0) {
    mainWindow?.webContents.send("new-clips-detected", newClips);
  }

  return newClips;
});
