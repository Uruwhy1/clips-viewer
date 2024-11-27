import { readDir, stat } from "@tauri-apps/plugin-fs";
import { loadFavourites } from "./externalFiles";
import { join } from "@tauri-apps/api/path";

export async function getAllClips(dirPath) {
  const favouritesSet = new Set(await loadFavourites());
  const allClips = [];

  try {
    const items = await readDir(dirPath);
    const clipPromises = items.map((item) =>
      processItem(item, dirPath, favouritesSet)
    );
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

async function processItem(item, dirPath, favouritesSet) {
  const fullPath = await join(dirPath, item.name);

  if (item.isDirectory) {
    return getClipsFromDirectoryWithMetadata(
      fullPath,
      item.name,
      favouritesSet
    );
  }

  return [];
}

async function getClipsFromDirectoryWithMetadata(dirPath, game, favouritesSet) {
  const clipFiles = [];

  try {
    const items = await readDir(dirPath);
    const filePromises = items.map((item) =>
      processFile(item, dirPath, game, favouritesSet)
    );
    const processedFiles = await Promise.all(filePromises);
    clipFiles.push(...processedFiles.flat());
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }

  return clipFiles;
}

async function processFile(item, dirPath, game, favouritesSet) {
  const fullPath = await join(dirPath, item.name);

  if (item.isDirectory) {
    return getClipsFromDirectoryWithMetadata(fullPath, game, favouritesSet); // Recursively process subdirectories
  }

  if (!item.isDirectory) {
    const stat1 = await stat(fullPath);
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
}

export const formatDate = (dateKey) => {
  dateKey = dateKey.toString();
  const parts = dateKey.split(" ");
  const monthIndex = parts[1];
  const day = parseInt(parts[2]);
  const year = parts[3];

  return `${monthIndex} ${day}, ${year}`;
};
