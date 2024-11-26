import { readDir, stat } from "@tauri-apps/plugin-fs";
import { loadFavourites } from "./loadExternalFiles";
import { join } from "@tauri-apps/api/path";

export async function getAllClips(dirPath) {
  const allClips = [];
  const favourites = await loadFavourites();

  try {
    const items = await readDir(dirPath);

    for (const item of items) {
      const fullPath = dirPath + "/" + item.name;

      try {
        const stat1 = await stat(fullPath);
        if (stat1.isDirectory) {
          const clips = await getClipsFromDirectoryWithMetadata(
            fullPath,
            item.name,
            favourites
          );
          allClips.push(...clips);
        }
      } catch (error) {
        console.warn(`Skipping item ${fullPath} due to error:`, error);
        continue;
      }
    }
  } catch (error) {
    console.error("Error reading clips directory:", error);
  }

  const sortedClips = allClips.sort((a, b) => b.date - a.date);
  return sortedClips;
}

async function getClipsFromDirectoryWithMetadata(dirPath, game, favourites) {
  const clipFiles = [];

  try {
    const items = await readDir(dirPath);

    for (const item of items) {
      const fullPath = await join(dirPath, item.name);
      const name = item.name.match(/[\sA-Za-z0-9]+/)[0];
      try {
        const stat1 = await stat(fullPath);

        let formattedDate = formatDate(stat1.mtime);

        if (stat1.isDirectory) {
          const subClips = await getClipsFromDirectoryWithMetadata(
            fullPath,
            game,
            favourites
          );
          clipFiles.push(...subClips);
        } else if (stat1.isFile) {
          clipFiles.push({
            game,
            name: name || item.name,
            filePath: fullPath,
            formattedDate,
            date: new Date(stat1.mtime),
            isFavourite: favourites.includes(fullPath),
          });
        }
      } catch (error) {
        console.warn(`Skipping item ${fullPath} due to error:`, error);
        continue;
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }

  return clipFiles;
}

export const formatDate = (dateKey) => {
  dateKey = dateKey.toString();
  const parts = dateKey.split(" ");

  const monthIndex = parts[1];
  const day = parseInt(parts[2]);
  const year = parts[3];

  return `${monthIndex} ${day}, ${year}`;
};
