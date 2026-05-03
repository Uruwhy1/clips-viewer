import { Clip } from "../types/clip";

declare global {
  interface Window {
    electron: {
      getAllClips: () => Promise<Clip[]>;
      onClipLoadingProgress: (callback: (progress: { current: number; total: number; game: string }) => void) => void;
      removeClipLoadingProgressListener: () => void;
      openFileExplorer: (filePath: string) => void;
      toggleFavourite: (filePath: string) => Promise<string[]>;
      deleteClip: (filePath: string) => Promise<boolean>;
      renameClip: (oldPath: string, newName: string) => Promise<{ newPath: string; newName: string } | null>;
      connectOBS: (port: string, password: string) => Promise<{ connected: boolean; message: string }>;
      startOBSRecording: (currentGame: string, record: boolean) => Promise<{ success: boolean; message?: string }>;
      stopOBSRecording: (record: boolean) => Promise<{ success: boolean; message?: string }>;
      checkOBSStatus: () => Promise<{ connected: boolean; version?: string; websocketVersion?: string; message?: string }>;
      scanForNewClips: (scanTimestamp: number, gameName: string) => Promise<any[]>;
      getGameDetectionStatus: () => Promise<{ running: boolean }>;
      getSettings: () => Promise<any>;
      saveSettings: (settings: any) => Promise<boolean>;
      selectDirectory: () => Promise<string | null>;
      selectFile: (filters: any[]) => Promise<string | null>;
      onStartRecording: (callback: () => void) => void;
      onStopRecording: (callback: (data: { scanTimestamp: number; game: string }) => void) => void;
      onNewClipsDetected: (callback: (clips: any[]) => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}

export async function getAllClips(
  gamesDir: string,
): Promise<[Set<string>, Clip[]]> {
  try {
    const allClips = await window.electron.getAllClips();
    const favouritesSet = new Set<string>();

    allClips.forEach((clip) => {
      if (clip.isFavourite) {
        favouritesSet.add(clip.filePath);
      }
    });

    return [favouritesSet, allClips];
  } catch (error) {
    console.error("Error reading clips directory:", error);
    return [new Set(), []];
  }
}

export type ClipLoadingProgress = { current: number; total: number; game: string; itemsTotal?: number; itemsProcessed?: number };

export function onClipLoadingProgress(
  callback: (progress: ClipLoadingProgress) => void,
): void {
  window.electron.onClipLoadingProgress(callback);
}

export function removeClipLoadingProgressListener(): void {
  window.electron.removeClipLoadingProgressListener();
}