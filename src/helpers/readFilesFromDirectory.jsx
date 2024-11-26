import { readDir, stat } from "@tauri-apps/api/fs";

export async function getAllClips(clipsPath) {
  const allClips = [];

  try {
    const gameFolders = await readDir(clipsPath, { recursive: false });

    for (const gameFolder of gameFolders) {
      if (gameFolder.children && gameFolder.children.length) {
        const gameName = gameFolder.name;

        const gameClips = await fetchClipsFromGameFolder(
          gameFolder.path,
          gameName
        );
        allClips.push(...gameClips);
      }
    }
  } catch (error) {
    console.error("Error reading clips folder:", error);
  }

  return allClips;
}

async function fetchClipsFromGameFolder(folderPath, gameName) {
  const clips = [];

  try {
    const filesAndFolders = await readDir(folderPath, { recursive: true });

    for (const item of filesAndFolders) {
      if (!item.children) {
        const fileStats = await stat(item.path);

        clips.push({
          name: item.title,
          path: item.path,
          game: gameName,
          modifiedAt: fileStats.modifiedAt,
          isFavourite: false,
        });
      }
    }
  } catch (error) {
    console.error(`Error reading game folder "${gameName}":`, error);
  }

  return clips;
}
