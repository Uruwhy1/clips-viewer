import { documentDir } from "@tauri-apps/api/path";
import { readTextFile, exists, mkdir } from "@tauri-apps/plugin-fs";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import { rename, remove } from "@tauri-apps/plugin-fs";

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

export const renameClipFile = async (oldPath, newTitle) => {
  const oldFileName = oldPath.split("\\").pop();
  const fileParts = oldFileName.match(
    /^(.+?)_([\d-]+_[\d-]+(?:\.?\d*)?)\.mp4$/
  );

  if (!fileParts) {
    throw new Error(
      "File name format is invalid. Expected format: TITLE_DATE_TIME.mp4"
    );
  }

  const [_, title, dateTimePart] = fileParts;

  if (!newTitle || newTitle.trim() === "") {
    throw new Error("Rename canceled or invalid name.");
  }

  const newFileName = `${newTitle}_${dateTimePart}.mp4`;
  const newPath = oldPath.replace(oldFileName, newFileName);

  try {
    await rename(oldPath, newPath);
    return { newPath, newName: newTitle };
  } catch (error) {
    console.error("Error renaming file:", error);
  }
};

export const deleteClipFile = async (filePath) => {
  try {
    await remove(filePath);
    return true;
  } catch (error) {
    console.error("Error deleting file:", error);
    return false;
  }
};
