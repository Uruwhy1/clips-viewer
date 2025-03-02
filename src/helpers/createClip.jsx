import { invoke } from "@tauri-apps/api/core";
import { formatTime } from "./formatTime";

async function createClipHandler(
  newName,
  startTime,
  endTime,
  currentClip,
  addClip
) {
  if (!startTime || !endTime) {
    return { response: false, error: "Missing start or end time." };
  }
  if (startTime >= endTime) {
    return { response: false, error: "Start time is after end time." };
  }

  if (newName.match(/[^A-Za-z0-9\s]/)) {
    return { response: false, error: "Invalid characters in name." };
  }

  if (startTime !== null && endTime !== null && currentClip) {
    const startFormatted = formatTime(startTime);
    const endFormatted = formatTime(endTime);

    const parts = currentClip.filePath.split("\\");
    const clipName = parts.pop().split("_");

    clipName[0] = newName ? newName : clipName[0] + " Clip";

    parts.push(clipName.join("_"));

    const outputFilePath = parts.join("\\");

    try {
      await invoke("create_clip", {
        inputFile: currentClip.filePath,
        startTime: startFormatted,
        endTime: endFormatted,
        outputFile: outputFilePath,
      });

      const newClip = {
        filePath: outputFilePath,
        name: newName ? newName : `${currentClip.name} Clip`,
        game: currentClip.game,
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
}

export default createClipHandler;
