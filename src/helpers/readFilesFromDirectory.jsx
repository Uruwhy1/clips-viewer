import { invoke } from "@tauri-apps/api/core";

export async function getAllClips(dirPath) {
  try {
    const result = await invoke("get_all_clips", { dirPath });
    const processedClips = result.allClips;

    const favouritesSet = new Set(result.favouritesSet);

    return [favouritesSet, processedClips];
  } catch (error) {
    console.error("Error reading clips directory:", error);
    return [new Set(), []];
  }
}
