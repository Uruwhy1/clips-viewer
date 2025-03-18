import { invoke } from "@tauri-apps/api/core";

export const checkAndDeleteOldClips = async (
  settings,
  allClips,
  setAllClips
) => {
  if (
    !settings.clipDeletion ||
    !settings.clipsDeleteThreshold ||
    !allClips.length
  ) {
    return;
  }
  try {
    const result = await invoke("delete_older_clips", {
      clips: allClips,
      thresholdGb: settings.clipsDeleteThreshold,
      deletionEnabled: settings.clipDeletion,
    });

    if (result.deletedCount > 0) {
      setAllClips((prevClips) =>
        prevClips.filter((clip) => !result.deletedPaths.includes(clip.filePath))
      );
      console.log(
        `Deleted ${
          result.deletedCount
        } clips. Freed ${result.freedSpaceGb.toFixed(
          2
        )} GB. New total: ${result.totalSizeGb.toFixed(2)} GB`
      );
      console.log(result.deletedPaths);
    } else {
      console.log(
        `No clips deleted. Total size: ${result.totalSizeGb.toFixed(
          2
        )} GB is under threshold of ${settings.clipsDeleteThreshold} GB`
      );
    }
  } catch (error) {
    console.error("Error in clip deletion:", error);
  }
};
