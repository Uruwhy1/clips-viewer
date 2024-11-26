import { documentDir } from "@tauri-apps/api/path";
import { readTextFile, exists, mkdir } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";

export async function loadFavourites() {
  try {
    const docsDir = await documentDir();
    const tauriFolderPath = await join(docsDir, "Tauri");
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
