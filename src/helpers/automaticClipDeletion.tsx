import { invoke } from "@tauri-apps/api/core";
import { Clip } from "../types/clip";
import { Settings } from "../types/settings";

export const checkAndDeleteOldClips = async (
  settings: Settings,
  allClips: Clip[],
  setAllClips: React.Dispatch<React.SetStateAction<Clip[]>>,
): Promise<[boolean, string] | undefined> => {
  if (
    !settings.clipDeletion ||
    !settings.clipsDeleteThreshold ||
    !allClips.length
  ) {
    return;
  }

  try {
    const result = (await invoke("delete_older_clips", {
      clips: allClips,
      thresholdGb: settings.clipsDeleteThreshold,
      deletionEnabled: settings.clipDeletion,
    })) as {
      deletedCount: number;
      deletedPaths: string[];
      freedSpaceGb: number;
      totalSizeGb: number;
    };

    if (result.deletedCount > 0) {
      setAllClips((prevClips: Clip[]) =>
        prevClips.filter(
          (clip: Clip) => !result.deletedPaths.includes(clip.filePath),
        ),
      );

      return [
        true,
        `Deleted ${result.deletedCount
        } clips. Freed ${result.freedSpaceGb.toFixed(
          2,
        )} GB. New total: ${result.totalSizeGb.toFixed(2)} GB`,
      ];
    } else {
      return [
        true,
        `No clips deleted. Total size: ${result.totalSizeGb.toFixed(
          2,
        )} GB is under threshold of ${settings.clipsDeleteThreshold} GB`,
      ];
    }
  } catch (error) {
    console.error("Error in clip deletion:", error);
  }
};
