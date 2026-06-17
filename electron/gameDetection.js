const { exec } = require("child_process");
const { promisify } = require("util");
const fs = require("fs").promises;
const path = require("path");

const { getMainWindow } = require("./window");
const obs = require("./obs");

const execAsync = promisify(exec);

let gameConfig = null;
let detectionInterval = null;
let preRecordingTimestamp = null;
let recordingGame = null;

function getRunningProcesses() {
  return new Promise(async (resolve, reject) => {
    if (process.platform === "win32") {
      exec("tasklist", (err, stdout) => {
        if (err) { reject(err); return; }
        resolve(stdout.toLowerCase());
      });
    } else {
      try {
        const procs = [];
        const procDir = await fs.readdir("/proc");
        for (const p of procDir) {
          if (/^\d+$/.test(p)) {
            try {
              const cmdline = await fs.readFile(path.join("/proc", p, "cmdline"), "utf8");
              if (cmdline) procs.push(cmdline.toLowerCase().replace(/\0/g, " "));
            } catch {}
          }
        }
        resolve(procs.join("\n"));
      } catch (e) { reject(e); }
    }
  });
}

async function checkGameRunning() {
  if (!gameConfig) return null;
  try {
    const runningProcesses = await getRunningProcesses();
    for (const [gameName, config] of Object.entries(gameConfig)) {
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

async function getActiveWindowTitle() {
  try {
    if (process.platform === "win32") {
      const scriptPath = path.join(__dirname, "get-window-title.ps1");
      const { stdout } = await execAsync(
        `powershell -NoProfile -File "${scriptPath}"`,
      );
      return stdout.trim();
    } else {
      const { stdout } = await execAsync("xdotool getactivewindow getwindowname 2>/dev/null");
      return stdout.trim();
    }
  } catch (e) {
    console.error("getActiveWindowTitle error:", e);
    return null;
  }
}

async function isGameWindowFocused(gameName) {
  const conf = gameConfig?.[gameName];
  if (!conf?.windowTitles?.length) return true;

  const title = await getActiveWindowTitle();
  if (!title) return true;

  return conf.windowTitles.some((mt) => title.toLowerCase().includes(mt.toLowerCase()));
}

function start(gamesDir, gamesConfig) {
  if (detectionInterval) return;
  gameConfig = gamesConfig;

  let lastDetectedGame = null;
  detectionInterval = setInterval(async () => {
    const activeTitle = await getActiveWindowTitle();
    console.log(`Active window: ${activeTitle}`);

    const currentGame = await checkGameRunning();
    if (currentGame && currentGame !== lastDetectedGame) {
      if (!(await isGameWindowFocused(currentGame))) return;

      preRecordingTimestamp = Date.now();
      recordingGame = currentGame;
      console.log(`Recording started for ${currentGame} at ${preRecordingTimestamp}`);

      try {
        await obs.setOutputPathForGame(gamesDir, currentGame);
        await obs.switchToScene(currentGame);
        await obs.startRecording(gameConfig[currentGame]?.record ?? false);
        getMainWindow()?.webContents.send("recording-started", {
          game: currentGame,
        });
      } catch (error) {
        console.error("Failed to start recording:", error);
      }
      lastDetectedGame = currentGame;
    } else if (currentGame && currentGame === lastDetectedGame) {
      await obs.switchToScene(currentGame);
    } else if (!currentGame && lastDetectedGame) {
      const stoppedGame = lastDetectedGame;
      const scanTs = preRecordingTimestamp;
      lastDetectedGame = null;
      preRecordingTimestamp = null;
      recordingGame = null;

      console.log(`Game ${stoppedGame} ended. Stopping recording and scanning...`);

      try {
        await obs.stopRecording(gameConfig[stoppedGame]?.record ?? false);
        getMainWindow()?.webContents.send("recording-stopped", {
          scanTimestamp: scanTs,
          game: stoppedGame,
        });
      } catch (error) {
        console.error("Failed to stop recording:", error);
      }
    }
  }, 10000);
}

function stop() {
  if (detectionInterval) {
    clearInterval(detectionInterval);
    detectionInterval = null;
  }
  gameConfig = null;
}

function getStatus() {
  return { running: detectionInterval !== null };
}

module.exports = { start, stop, getStatus };
