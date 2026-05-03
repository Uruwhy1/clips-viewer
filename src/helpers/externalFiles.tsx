export async function saveFavourites(favourites: Set<string>) {
  try {
    await window.electron.toggleFavourite("");
    const arr = [...favourites];
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
  newTitle: string,
): Promise<RenameResult> => {
  const oldFileName = oldPath.split("\\").pop()?.split("/").pop();
  if (!oldFileName) {
    throw new Error("Invalid file path");
  }

  const fileParts = oldFileName.match(
    /^(.+?)_([\d-]+_[\d-]+(?:\.?\d*)?)\.mp4$/,
  );

  if (!fileParts || fileParts.length < 3) {
    const ext = oldFileName.includes(".mkv") ? ".mkv" : ".mp4";
    const newPath = oldPath.replace(oldFileName, `${newTitle}${ext}`);
    const result = await window.electron.renameClip(oldPath, newTitle);
    if (result) {
      return { newPath: result.newPath, newName: result.newName };
    }
    throw new Error("Rename canceled or invalid name.");
  }

  const [_, title, dateTimePart] = fileParts;
  const trimmedTitle = newTitle?.trim();
  if (!trimmedTitle) {
    throw new Error("Rename canceled or invalid name.");
  }

  const ext = oldFileName.includes(".mkv") ? ".mkv" : ".mp4";
  const newFileName = `${trimmedTitle}_${dateTimePart}${ext}`;
  const newPath = oldPath.replace(oldFileName, newFileName);

  try {
    const result = await window.electron.renameClip(oldPath, trimmedTitle);
    if (result) {
      return { newPath: result.newPath, newName: result.newName };
    }
    throw new Error("Failed to rename");
  } catch (error) {
    console.error("Error renaming file:", error);
    throw new Error(
      `Failed to rename file: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

export const deleteClipFile = async (filePath: string): Promise<boolean> => {
  try {
    return await window.electron.deleteClip(filePath);
  } catch (error) {
    console.error("Error deleting file:", error);
    return false;
  }
};