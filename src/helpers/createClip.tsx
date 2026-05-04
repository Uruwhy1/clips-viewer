import { Clip } from "../types/clip";
import { PersistentNotificationInfo } from "../types/popups";

const formatTimeForFFmpeg = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const formatTimeFromSeconds = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export default async function createClipHandler(
  startTime: number,
  endTime: number,
  currentClip: Clip,
  name: string,
  addClip: (clip: Clip) => void,
  setCurrentClip: (clip: Clip) => void,
  deleteClip: (clipPath: string, isFavourite: boolean) => Promise<boolean>,
  showPersistentNotification: (id: string, info: PersistentNotificationInfo) => void,
  removePersistentNotification: (id: string) => void,
) {
  try {
    // Get gamesDir from settings
    const settings = await window.electron.getSettings();
    const gamesDir = settings.gamesDir;

    if (!gamesDir) {
      return { response: false, error: "Games directory not set in settings" };
    }

    // Format times for ffmpeg
    const startTimeStr = formatTimeForFFmpeg(startTime);
    const endTimeStr = formatTimeForFFmpeg(endTime);
    const totalDuration = endTime - startTime;

    // Copy original clip's path and replace just the name part
    // Format: {gamesDir}/{game}/{originalName}_{date}_{time}.mp4
    // We want: {gamesDir}/{game}/{newName}_{date}_{time}.mp4
    const sanitizedName = name.replace(/[<>:"/\\|?*]/g, "");
    const originalFileName = currentClip.filePath.split("/").pop() || currentClip.filePath.split("\\").pop();
    const dateTimeMatch = originalFileName.match(/(_[\d-]+_[\d-]+(?:\.?\d*)?\.mp4$)/);
    const dateTimePart = dateTimeMatch ? dateTimeMatch[1] : "_unknown.mp4";
    const outputFileName = `${sanitizedName}${dateTimePart}`;
    const outputFile = `${gamesDir}/${currentClip.game}/${outputFileName}`;

    // Show initial progress
    showPersistentNotification("creating-clip", {
      mainText: "Creating clip...",
      progressText: ["Extracting segment..."],
      progress: 0,
    });

    // Set up progress listener
    window.electron.onClipProgress((progress) => {
      const { totalDuration: dur, startSeconds } = progress;
      const processedTime = Math.min(dur, Math.max(0, progress.currentTime || 0));
      const percent = Math.round((processedTime / dur) * 100);
      
      showPersistentNotification("creating-clip", {
        mainText: "Creating clip...",
        progressText: [`${formatTimeFromSeconds(processedTime)} / ${formatTimeFromSeconds(dur)}`],
        progress: percent,
      });
    });

    // Call the backend to create the clip
    const result = await window.electron.createClip({
      inputFile: currentClip.filePath,
      startTime: startTimeStr,
      endTime: endTimeStr,
      outputFile: outputFile,
    });

    window.electron.removeClipProgressListener();

    if (!result.success) {
      removePersistentNotification("creating-clip");
      return { response: false, error: result.error || "Failed to create clip" };
    }

    // Create clip object - use original clip's date
    const newClip: Clip = {
      name: name,
      filePath: result.path,
      mediaPath: `clips://${encodeURIComponent(result.path)}`,
      game: currentClip.game,
      date: currentClip.date,
      formattedDate: currentClip.formattedDate,
      isFavourite: false,
      thumbnail: `clips://${encodeURIComponent(result.path.replace(/\.mp4$/i, ".jpg"))}`,
      videoDuration: result.duration,
    };

    // Add the new clip to the context
    addClip(newClip);

    // Show completion with buttons
    showPersistentNotification("creating-clip", {
      mainText: "Clip created successfully!",
      progressText: [name],
      progress: 100,
      isComplete: true,
      buttons: [
        { 
          text: "Go to Clip", 
          func: () => {
            removePersistentNotification("creating-clip");
            setCurrentClip(newClip);
          }, 
          protect: false 
        },
        { 
          text: "Delete current and go", 
          func: async () => {
            await deleteClip(currentClip.filePath, currentClip.isFavourite);
            removePersistentNotification("creating-clip");
            setCurrentClip(newClip);
          }, 
          protect: false 
        }
      ]
    });

    return { response: true, error: null };
  } catch (error) {
    removePersistentNotification("creating-clip");
    console.error("Error creating clip:", error);
    return { response: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}