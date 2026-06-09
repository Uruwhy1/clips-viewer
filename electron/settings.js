const fs = require("fs").promises;
const { CONFIG_PATH, DEFAULT_SETTINGS } = require("./config");

let settings = { ...DEFAULT_SETTINGS };

async function loadSettings() {
  try {
    const exists = await fs.access(CONFIG_PATH).then(() => true).catch(() => false);
    if (!exists) {
      await fs.writeFile(CONFIG_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2));
      settings = { ...DEFAULT_SETTINGS };
      return settings;
    }
    const data = await fs.readFile(CONFIG_PATH, "utf8");
    settings = { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    return settings;
  } catch (error) {
    console.error("Error loading settings:", error);
    settings = { ...DEFAULT_SETTINGS };
    return settings;
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

function getSettings() {
  return settings;
}

module.exports = { loadSettings, saveSettings, getSettings };
