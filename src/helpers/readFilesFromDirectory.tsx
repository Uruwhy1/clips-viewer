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
