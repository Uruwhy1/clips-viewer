import { Clip } from "../types/clip";

export async function getAllClips(
  gamesDir: string,
): Promise<[Set<string>, Clip[]]> {
  try {
    const allClips = await window.electron.getAllClips();
    const favouritesSet = new Set<string>();

    allClips.forEach((clip) => {
      if (clip.isFavourite) {
        favouritesSet.add(clip.filePath);
      }
    });

    return [favouritesSet, allClips];
  } catch (error) {
    console.error("Error reading clips directory:", error);
    return [new Set(), []];
  }
}

export type ClipLoadingProgress = { current: number; total: number; game: string; itemsTotal?: number; itemsProcessed?: number };

export function onClipLoadingProgress(
  callback: (progress: ClipLoadingProgress) => void,
): void {
  window.electron.onClipLoadingProgress(callback);
}

export function removeClipLoadingProgressListener(): void {
  window.electron.removeClipLoadingProgressListener();
}
