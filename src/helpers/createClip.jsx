import { invoke } from "@tauri-apps/api/core";
import { formatTime } from "./formatTime";

async function createClipHandler(
  newName,
  startTime,
  endTime,
  currentClip,
  addClip
) {
  if (startTime >= endTime) {
    alert("The start is after the end! D:");
    return;
  }

  if (newName.match(/[^A-Za-z0-9]/)) {
    alert("Invalid name input... idiot.");
    return;
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
    } catch (error) {
      alert(`Error creating clip: ${error}`);
      console.error(error);
    }
  } else {
    alert("Please mark both start and end times first.");
  }
}

export default createClipHandler;
