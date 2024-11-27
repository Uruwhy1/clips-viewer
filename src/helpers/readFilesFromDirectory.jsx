import { readDir, stat } from "@tauri-apps/plugin-fs";
import { loadFavourites } from "./externalFiles";
import { join } from "@tauri-apps/api/path";

export async function getAllClips(dirPath) {
  const favouritesSet = new Set(await loadFavourites());

  const allClips = [];
  try {
    const items = await readDir(dirPath);
    const clipPromises = items.map(async (item) => {
      const fullPath = await join(dirPath, item.name);
      try {
        const stat1 = await stat(fullPath);
        if (stat1.isDirectory) {
          const clips = await getClipsFromDirectoryWithMetadata(
            fullPath,
            item.name,
            favouritesSet
          );
          return clips;
        }
        return [];
      } catch (error) {
        console.warn(`Skipping item ${fullPath} due to error:`, error);
        return [];
      }
    });

    const processedClips = await Promise.all(clipPromises);
    allClips.push(...processedClips.flat());
  } catch (error) {
    console.error("Error reading clips directory:", error);
  }

  return [
    favouritesSet,
    allClips.sort((a, b) => b.date.getTime() - a.date.getTime()),
  ];
}

async function getClipsFromDirectoryWithMetadata(dirPath, game, favouritesSet) {
  const clipFiles = [];
  try {
    const items = await readDir(dirPath);

    const filePromises = items.map(async (item) => {
      const fullPath = await join(dirPath, item.name);
      try {
        const stat1 = await stat(fullPath);

        if (stat1.isDirectory) {
          const subClips = await getClipsFromDirectoryWithMetadata(
            fullPath,
            game,
            favouritesSet
          );
          return subClips;
        }

        if (stat1.isFile) {
          const name = item.name.match(/[\sA-Za-z0-9]+/)?.[0] || item.name;

          return [
            {
              game,
              name,
              filePath: fullPath,
              formattedDate: formatDate(stat1.mtime),
              date: new Date(stat1.mtime),
              isFavourite: favouritesSet.has(fullPath),
            },
          ];
        }

        return [];
      } catch (error) {
        console.warn(`Skipping item ${fullPath} due to error:`, error);
        return [];
      }
    });

    const processedFiles = await Promise.all(filePromises);
    clipFiles.push(...processedFiles.flat());
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
