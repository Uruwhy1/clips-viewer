import { readDir, stat } from "@tauri-apps/plugin-fs";
import { loadFavourites } from "./externalFiles";
import { join } from "@tauri-apps/api/path";
import { formatDate } from "./formatDate";

export async function getAllClips(dirPath) {
  const favouritesSet = new Set(await loadFavourites());
  const allClips = [];

  try {
    await processDirectory(dirPath, null, favouritesSet, allClips);
  } catch (error) {
    console.error("Error reading clips directory:", error);
  }

  return [
    favouritesSet,
    allClips.sort((a, b) => b.date.getTime() - a.date.getTime()),
  ];
}

async function processDirectory(dirPath, game, favouritesSet, allClips) {
  try {
    const items = await readDir(dirPath);

    const processPromises = items.map(async (item) => {
      const fullPath = await join(dirPath, item.name);

      if (item.isDirectory) {
        const currentGame = game || item.name;
        await processDirectory(fullPath, currentGame, favouritesSet, allClips);
      } else if (game) {
        const statInfo = await stat(fullPath);
        const name = item.name.match(/[\sA-Za-z0-9']+/)?.[0] || item.name;

        allClips.push({
          game,
          name,
          filePath: fullPath,
          formattedDate: formatDate(statInfo.mtime),
          date: new Date(statInfo.mtime),
          isFavourite: favouritesSet.has(fullPath),
        });
      }
    });

    await Promise.all(processPromises);
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }
}
