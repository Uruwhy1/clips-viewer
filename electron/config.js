const { app } = require("electron");
const path = require("path");

const isDev = process.env.DEV ? process.env.DEV.trim() === "true" : false;

const CONFIG_PATH = path.join(app.getPath("userData"), "settings.json");
const FAVOURITES_PATH = path.join(app.getPath("userData"), "favourites.json");
const CLIP_META_DIR = path.join(app.getPath("userData"), "clip-meta");
const THUMBNAIL_CACHE_DIR = path.join(app.getPath("userData"), "thumbnails");

const DEFAULT_SETTINGS = {
  gamesDir: "",
  gamesConfig: {},
  scrollbarOff: false,
  borderRadiusOff: false,
  clipsDeleteThreshold: 999999,
  clipDeletion: false,
  obs: {},
  theme: "System (Catppuccin)",
  accentVariable: "--blue",
  recordingSoundEnabled: false,
  recordingMethod: "obs",
};

function getAssetPath(asset) {
  if (isDev) {
    return path.join(__dirname, "..", "assets", asset);
  }
  return path.join(process.resourcesPath, "assets", asset);
}

module.exports = {
  isDev,
  CONFIG_PATH,
  FAVOURITES_PATH,
  CLIP_META_DIR,
  THUMBNAIL_CACHE_DIR,
  DEFAULT_SETTINGS,
  getAssetPath,
};
