import { invoke } from "@tauri-apps/api/core";
import { formatTime } from "./formatTime";
import { useContext } from "react";
import GlobalContext from "../contexts/GlobalContext";

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

  if (startTime !== null && endTime !== null && currentClip) {
    const startFormatted = formatTime(startTime);
    const endFormatted = formatTime(endTime);

    const parts = currentClip.filePath.split("_");
    const clipName = parts.shift().split("\\");

    clipName[clipName.length - 1] = newName
      ? newName
      : clipName[clipName.length - 1] + " Clip";

    parts.unshift(clipName.join("\\"));

    const outputFilePath = parts.join("_").replace(/\.[^/.]+$/, "") + ".mp4";

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
