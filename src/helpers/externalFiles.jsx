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
  console.log("Xd");

  const oldFileName = oldPath.split("\\").pop();
  const fileParts = oldFileName.match(
    /^(.+?)_(\d{2}-\d{2}-\d{4}_\d{2}-\d{2}-\d{2})\.mp4$/
  );

  if (!fileParts) {
    alert("File name format is invalid. Expected format: TITLE_DATE_TIME.mp4");
    return;
  }

  const [_, title, dateTime] = fileParts;

  if (!newTitle || newTitle.trim() === "") {
    alert("Rename canceled or invalid name.");
    return;
  }

  const newFileName = `${newTitle}_${dateTime}.mp4`;
  const newPath = oldPath.replace(oldFileName, newFileName);

  try {
    await rename(oldPath, newPath);

    return { newPath, newName: newTitle };
  } catch (error) {
    console.error("Error renaming file:", error);
    return null;
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
