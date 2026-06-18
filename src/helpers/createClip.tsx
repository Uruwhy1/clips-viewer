import { invoke } from "@tauri-apps/api/core";
import { formatTime } from "./formatTime";
import { Clip } from "../types/clip";
import { PersistentNotificationInfo } from "../types/popups";

interface ClipResult {
  response: boolean;
  error?: string;
}

export default async function createClipHandler(
  startTime: number,
  endTime: number,
  currentClip: Clip,
  newName: string,

  addClip: (clip: Clip) => () => void,
  showPersistentNotification: (
    id: string,
    options: PersistentNotificationInfo,
  ) => void,
  removePersistentNotification: (id: string) => void,
): Promise<ClipResult> {
  const startFormatted: string = formatTime(startTime);
  const endFormatted: string = formatTime(endTime);

  let outputFilePath: string;
  let clipName: string;

  const lastSeparator = Math.max(
    currentClip.filePath.lastIndexOf("/"),
    currentClip.filePath.lastIndexOf("\\"),
  );
  const dir = lastSeparator >= 0 ? currentClip.filePath.substring(0, lastSeparator + 1) : "";
  const fileName = currentClip.filePath.substring(lastSeparator + 1);

  const fileNameParts = fileName.split("_");
  fileNameParts[0] = newName;
  outputFilePath = dir + fileNameParts.join("_");
  clipName = newName;

  try {
    const popupId: string = "clip-process";
    removePersistentNotification(popupId);

    const operationText = "Creating Clip...";
    showPersistentNotification(popupId, {
      mainText: operationText,
      progressText: [`Starting clipping process...`],
      progress: 0,
    });

    await invoke("create_clip", {
      inputFile: currentClip.filePath,
      startTime: startFormatted,
      endTime: endFormatted,
      outputFile: outputFilePath,
    }).catch((err: Error) => {
      console.error(`Clipping failed:`, err);
      showPersistentNotification(popupId, {
        mainText: `Clipping failed: ${err}`,
        progress: 100,
        isComplete: true,
      });
      throw err;
    });

    const processedClip: Clip = {
      filePath: outputFilePath,
      name: clipName,
      game: currentClip.game,
      date: new Date(),
      formattedDate: currentClip.formattedDate,
      isFavourite: currentClip.isFavourite,
      thumbnail: "",
    };

    const setCurrent = addClip(processedClip);

    showPersistentNotification(popupId, {
      mainText: "Clip created successfully!",
      progress: 100,
      isComplete: true,
      buttons: [
        {
          text: "Go to Clip",
          func: setCurrent.setAsCurrent,
          protect: false,
        },
        {
          text: "Go and Delete Current",
          func: setCurrent.setAsCurrentAndRemoveOld,
          protect: true,
        },
      ],
    });

    return { response: true };
  } catch (error) {
    console.error(error);
    return {
      response: false,
      error: `Error creating clip: ${error}`,
    };
  }
}
