import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { documentDir, join } from "@tauri-apps/api/path";
import { Settings } from "../types/settings";

export const loadSettings = async (
  setSettings: React.Dispatch<React.SetStateAction<Settings>> | null
) => {
  const settingsPath = await join(await documentDir(), "Tauri/settings.json");

  try {
    const settingsData = await readTextFile(settingsPath);
    const settings = JSON.parse(settingsData);

    if (setSettings) {
      setSettings(settings);
    }
    await saveSettings(settings);

    return settings;
  } catch (error: unknown) {
    console.log(error);
    if (error instanceof Error) {
      if (error.message.includes("The system cannot find the file")) {
        console.warn("Settings file not found. Creating default settings.");

        const defaultSettings = {
          gamesDir: null,
          gamesConfig: {},
          scrollbarOff: false,
          clipDeletion: false,
          clipsDeleteThreshold: 999999,
          obs: {
            port: "0",
            password: "",
          },
        };
        await saveSettings(defaultSettings);
      }
    } else {
      console.error("Failed to load settings:", error);
    }
  }
};

export const saveSettings = async (settings: Settings) => {
  const settingsPath = await join(await documentDir(), "Tauri/settings.json");
  try {
    await writeTextFile(settingsPath, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
};
