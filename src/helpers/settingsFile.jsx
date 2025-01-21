import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { documentDir, join } from "@tauri-apps/api/path";

export const loadSettings = async (setSettings) => {
  const settingsPath = await join(await documentDir(), "Tauri/settings.json");

  try {
    const settingsData = await readTextFile(settingsPath);
    setSettings(JSON.parse(settingsData));
    await saveSettings(JSON.parse(settingsData));
  } catch (error) {
    console.log(error);
    if (error.includes("The system cannot find the file")) {
      console.warn("Settings file not found. Creating default settings.");

      const defaultSettings = { gamesDir: null, gamesConfig: {} };
      await saveSettings(defaultSettings);
    } else {
      console.error("Failed to load settings:", error);
    }
  }
};

export const saveSettings = async (settings) => {
  const settingsPath = await join(await documentDir(), "Tauri/settings.json");
  try {
    await writeTextFile(settingsPath, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
};
