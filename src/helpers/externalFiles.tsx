import { documentDir, join } from "@tauri-apps/api/path";
import { getName } from "@tauri-apps/api/app";
import { writeTextFile, rename, remove } from "@tauri-apps/plugin-fs";

let tauriFolderPath: string;

async function initializePaths() {
  try {
    const docsDir = await documentDir();
    const appName = await getName(); 
    tauriFolderPath = await join(docsDir, appName);
  } catch (error) {
    console.error("Error initializing paths:", error);
  }
}

export async function saveFavourites(favourites: Set<string>) {
  try {
    if (!tauriFolderPath) await initializePaths();
    const favouritesFilePath = await join(tauriFolderPath, "favourites.json");
    await writeTextFile(favouritesFilePath, JSON.stringify([...favourites]));
  } catch (error) {
    console.error("Error saving favourites:", error);
  }
}

type RenameResult = {
  newPath: string;
  newName: string;
};

export const renameClipFile = async (
  oldPath: string,
  newTitle: string
): Promise<RenameResult> => {
  const oldFileName = oldPath.split("\\").pop();
  if (!oldFileName) {
    throw new Error("Invalid file path");
  }

  const fileParts = oldFileName.match(
    /^(.+?)_([\d-]+_[\d-]+(?:\.?\d*)?)\.mp4$/
  );

  if (!fileParts || fileParts.length < 3) {
    throw new Error(
      "File name format is invalid. Expected format: TITLE_DATE_TIME.mp4"
    );
  }

  const [_, title, dateTimePart] = fileParts;

  const trimmedTitle = newTitle?.trim();
  if (!trimmedTitle) {
    throw new Error("Rename canceled or invalid name.");
  }

  const newFileName = `${trimmedTitle}_${dateTimePart}.mp4`;
  const newPath = oldPath.replace(oldFileName, newFileName);

  try {
    await rename(oldPath, newPath);
    return { newPath, newName: trimmedTitle };
  } catch (error) {
    console.error("Error renaming file:", error);
    throw new Error(
      `Failed to rename file: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

export const deleteClipFile = async (filePath: string): Promise<boolean> => {
  try {
    await remove(filePath);
    return true;
  } catch (error) {
    console.error("Error deleting file:", error);
    return false;
  }
};
