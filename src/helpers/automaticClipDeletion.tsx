import type { Dispatch, SetStateAction } from "react";
import { Clip } from "../types/clip";
import { Settings } from "../types/settings";
import type { default as ElectronAPI } from "../types/electron";

declare const window: Window & { electron: typeof ElectronAPI };

export const checkAndDeleteOldClips = async (
  settings: Settings,
  allClips: Clip[],
  setAllClips: Dispatch<SetStateAction<Clip[]>>,
): Promise<[boolean, string] | undefined> => {
  if (
    !settings.clipDeletion ||
    !settings.clipsDeleteThreshold ||
    !allClips.length
  ) {
    return;
  }

  const clipCount = allClips.length;
  if (clipCount <= settings.clipsDeleteThreshold) {
    return;
  }

  const nonFavoriteClips = allClips
    .filter((clip) => !clip.isFavourite)
    .sort((a, b) => a.date - b.date);

  if (nonFavoriteClips.length === 0) {
    return [true, "No non-favorite clips to delete."];
  }

  const clipsToDelete = clipCount - settings.clipsDeleteThreshold;
  const clipsToRemove = nonFavoriteClips.slice(0, clipsToDelete);

  for (const clip of clipsToRemove) {
    const success = await window.electron.deleteClip(clip.filePath);
    if (!success) {
      console.error("Failed to delete clip:", clip.filePath);
    }
  }

  setAllClips((prevClips) =>
    prevClips.filter((clip) => !clipsToRemove.some((c) => c.filePath === clip.filePath)),
  );

  return [true, `Deleted ${clipsToRemove.length} old clip(s).`];
};