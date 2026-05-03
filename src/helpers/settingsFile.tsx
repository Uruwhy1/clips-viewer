import { Settings } from "../types/settings";
import type { Dispatch, SetStateAction } from "react";

export const loadSettings = async (
  setSettings: Dispatch<SetStateAction<Settings>> | null,
): Promise<Settings> => {
  try {
    const settings = await window.electron.getSettings();
    if (setSettings) {
      setSettings(settings);
    }
    return settings;
  } catch (error) {
    console.error("Failed to load settings:", error);
    return defaultSettings;
  }
};

export const saveSettings = async (settings: Settings): Promise<boolean> => {
  try {
    return await window.electron.saveSettings(settings);
  } catch (error) {
    console.error("Failed to save settings:", error);
    return false;
  }
};

export const defaultSettings: Settings = {
  theme: "dark",
  gamesDir: null,
  gamesConfig: {},
  scrollbarOff: false,
  clipDeletion: false,
  clipsDeleteThreshold: 0,
  borderRadiusOff: false,
  obs: {port: "", password: ""},
  accentVariable: "--blue",
  recordingSoundEnabled: false,
  recordingMethod: "obs",
};
