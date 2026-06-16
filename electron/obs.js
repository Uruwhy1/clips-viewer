const path = require("path");
const fs = require("fs").promises;
const OBSWebSocket = require("obs-websocket-js").OBSWebSocket;

const obs = new OBSWebSocket();

async function connect(port, password) {
  await obs.connect(`ws://localhost:${port}`, password);
}

async function startRecording(fullRecording) {
  if (fullRecording) {
    await obs.call("StartRecord");
  }
  await obs.call("StartReplayBuffer");
}

async function stopRecording(fullRecording) {
  if (fullRecording) {
    await obs.call("StopRecord");
  }
  await obs.call("StopReplayBuffer");
}

async function switchToScene(sceneName) {
  try {
    const sceneList = await obs.call("GetSceneList");
    const exists = sceneList.scenes.some((s) => s.sceneName === sceneName);
    if (exists) {
      await obs.call("SetCurrentProgramScene", { sceneName });
      return true;
    }
    return false;
  } catch {
    try {
      const sceneList = await obs.call("GetSceneList");
      const exists = sceneList.scenes.some((s) => s.sceneName === sceneName);
      if (exists) {
        await obs.call("SetCurrentScene", { sceneName });
        return true;
      }
    } catch {}
    return false;
  }
}

async function setOutputPathForGame(gamesDir, gameName) {
  if (!gamesDir) return false;
  try {
    const gameDir = path.join(gamesDir, gameName);
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

async function checkStatus() {
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
}

module.exports = {
  connect,
  startRecording,
  stopRecording,
  switchToScene,
  setOutputPathForGame,
  checkStatus,
};
