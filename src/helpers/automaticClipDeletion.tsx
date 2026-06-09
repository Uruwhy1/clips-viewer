import type { Dispatch, SetStateAction } from "react";
import { Clip } from "../types/clip";
import { Settings } from "../types/settings";

const GB = 1024 * 1024 * 1024;

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

  const sizes = await window.electron.getClipsSizes(allClips.map((c) => c.filePath));
  const totalBytes = Object.values(sizes).reduce((sum, b) => sum + b, 0);
  const totalGB = totalBytes / GB;

  if (totalGB <= settings.clipsDeleteThreshold) {
    console.log(totalGB, settings.clipsDeleteThreshold)
    return;
  }

  const nonFavoriteClips = allClips
    .filter((clip) => !clip.isFavourite)
    .sort((a, b) => a.date - b.date);

  if (nonFavoriteClips.length === 0) {
    return [true, "No non-favorite clips to delete."];
  }

  let bytesToFree = totalBytes - settings.clipsDeleteThreshold * GB;
  const clipsToRemove: Clip[] = [];

  for (const clip of nonFavoriteClips) {
    if (bytesToFree <= 0) break;
    clipsToRemove.push(clip);
    bytesToFree -= sizes[clip.filePath] || 0;
  }

  for (const clip of clipsToRemove) {
    const success = await window.electron.deleteClip(clip.filePath);
    if (!success) {
      console.error("Failed to delete clip:", clip.filePath);
    }
  }

  setAllClips((prevClips) =>
    prevClips.filter((clip) => !clipsToRemove.some((c) => c.filePath === clip.filePath)),
  );

  return [true, `Deleted ${clipsToRemove.length} old clip(s) to stay under ${settings.clipsDeleteThreshold} GB.`];
};
