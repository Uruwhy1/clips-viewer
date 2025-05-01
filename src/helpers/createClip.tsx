import { invoke } from "@tauri-apps/api/core";
import { formatTime } from "./formatTime";
import { Clip } from "../types/clip";

interface NotificationOptions {
  mainText: string;
  progressText?: string[];
  progress: number;
  isComplete?: boolean;
}

interface ClipResult {
  response: boolean;
  error?: string;
}

async function createClipHandler(
  startTime: number | null,
  endTime: number | null,
  currentClip: Clip | null,
  addClip: (clip: Clip) => void,
  showPersistentNotification: (
    id: string,
    options: NotificationOptions
  ) => void,
  removePersistentNotification: (id: string) => void
): Promise<ClipResult> {
  if (!startTime || !endTime) {
    return { response: false, error: "Missing start or end time." };
  }
  if (startTime >= endTime) {
    return { response: false, error: "Start time is after end time." };
  }

  if (startTime !== null && endTime !== null && currentClip) {
    const startFormatted: string = formatTime(startTime);
    const endFormatted: string = formatTime(endTime);
    const parts: string[] = currentClip.filePath.split("\\");
    const clipName: string[] = parts.pop()!.split("_");

    clipName[0] = clipName[0] + " Clip";
    parts.push(clipName.join("_"));

    const outputFilePath: string = parts.join("\\");

    try {
      const popupId: string = "clip-process";
      removePersistentNotification(popupId);
      showPersistentNotification(popupId, {
        mainText: "Creating Clip...",
        progressText: ["Starting clipping process..."],
        progress: 0,
      });

      await invoke("create_clip", {
        inputFile: currentClip.filePath,
        startTime: startFormatted,
        endTime: endFormatted,
        outputFile: outputFilePath,
      }).catch((err: Error) => {
        console.error("Clipping failed:", err);
        showPersistentNotification(popupId, {
          mainText: `Clip failed: ${err}`,
          progress: 100,
          isComplete: true,
        });
      });

      const newClip: Clip = {
        filePath: outputFilePath,
        name: `${currentClip.name} Clip`,
        game: currentClip.game,
        date: new Date(),
        formattedDate: currentClip.formattedDate,
        isFavourite: false,
      };

      addClip(newClip);
      return { response: true };
    } catch (error) {
      console.error(error);
      return { response: false, error: `Error creating clip: ${error}` };
    }
  }

  // idk why typescript wants this
  return { response: false, error: "Invalid clip parameters" };
}

export default createClipHandler;
