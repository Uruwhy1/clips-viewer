import { documentDir } from "@tauri-apps/api/path";
import { readTextFile, exists, mkdir } from "@tauri-apps/plugin-fs";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";

let tauriFolderPath;

async function initializePaths() {
  try {
    const docsDir = await documentDir();
    tauriFolderPath = await join(docsDir, "Tauri");
  } catch (error) {
    console.error("Error initializing paths:", error);
  }
}

export async function loadFavourites() {
  try {
    if (!tauriFolderPath) await initializePaths();

    const tauriFolderExists = await exists(tauriFolderPath);

    if (!tauriFolderExists) {
      await mkdir(tauriFolderPath);
    }

    const favouritesFilePath = await join(tauriFolderPath, "favourites.json");
    const fileExists = await exists(favouritesFilePath);

    if (fileExists) {
      const favouritesContent = await readTextFile(favouritesFilePath);
      const favourites = JSON.parse(favouritesContent);

      return favourites;
    }
  } catch (error) {
    console.error("Error loading or creating favourites:", error);
    return null;
  }
}

export async function saveFavourites(favourites) {
  try {
    if (!tauriFolderPath) await initializePaths();
    const favouritesFilePath = await join(tauriFolderPath, "favourites.json");
    await writeTextFile(favouritesFilePath, JSON.stringify([...favourites]));
  } catch (error) {
    console.error("Error saving favourites:", error);
  }
}

export async function loadOBSConfig() {
  try {
    if (!tauriFolderPath) await initializePaths();

    const tauriFolderExists = await exists(tauriFolderPath);
    if (!tauriFolderExists) {
      await mkdir(tauriFolderPath);
    }

    const configFilePath = await join(tauriFolderPath, "gameConfig.json");
    const configData = await readTextFile(configFilePath);

    return JSON.parse(configData);
  } catch (error) {
    console.error("Error loading OBS config:", error);
    return null;
  }
}
