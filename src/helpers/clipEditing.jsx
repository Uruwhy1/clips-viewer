import { rename } from "@tauri-apps/plugin-fs";

export const renameClipFile = async (oldPath, newTitle) => {
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
