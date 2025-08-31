import { invoke } from "@tauri-apps/api/core";
import { Clip } from "../types/clip";

export async function getAllClips(
  dirPath: string,
): Promise<[Set<string>, Clip[]]> {
  try {
    const result = (await invoke("get_all_clips", { dirPath })) as {
      allClips: Clip[];
      favouritesSet: Set<string>;
    };
    const processedClips = result.allClips;

    const favouritesSet = new Set(result.favouritesSet);

    return [favouritesSet, processedClips];
  } catch (error) {
    console.error("Error reading clips directory:", error);
    return [new Set(), []];
  }
}

export async function checkForNewClips() {
  const lastStopped = localStorage.getItem("lastRecordingStoppedAt");
  if (!lastStopped || !settings.gamesDir) return [];

  const sinceTimestamp = parseInt(lastStopped, 10);
  const newClips = await invoke<Clip[]>("get_new_clips_since", {
    dir: settings.gamesDir,
    sinceTimestamp,
  });

  if (newClips.length > 0) {
    setAllClips((prev) => [...newClips, ...prev]);
  }
}
