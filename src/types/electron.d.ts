import { Clip } from "./clip";

export interface ElectronAPI {
      getAllClips: () => Promise<Clip[]>;
  onClipLoadingProgress: (
    callback: (progress: {
      current: number;
      total: number;
      game: string;
      itemsTotal?: number;
      itemsProcessed?: number;
    }) => void,
  ) => void;
  removeClipLoadingProgressListener: () => void;
  openFileExplorer: (filePath: string) => void;
  toggleFavourite: (filePath: string) => Promise<string[]>;
  deleteClip: (filePath: string) => Promise<boolean>;
  getClipsSizes: (filePaths: string[]) => Promise<Record<string, number>>;
  renameClip: (
    oldPath: string,
    newName: string,
  ) => Promise<{ newPath: string; newName: string } | null>;
  connectOBS: (
    port: string,
    password: string,
  ) => Promise<{ connected: boolean; message: string }>;

  checkOBSStatus: () => Promise<{
    connected: boolean;
    version?: string;
    websocketVersion?: string;
    message?: string;
  }>;
  scanForNewClips: (scanTimestamp: number, gameName: string) => Promise<any[]>;
  getGameDetectionStatus: () => Promise<{ running: boolean }>;
  getSettings: () => Promise<any>;
  saveSettings: (settings: any) => Promise<boolean>;
  selectDirectory: () => Promise<string | null>;
  selectFile: (filters: any[]) => Promise<string | null>;
  onRecordingStarted: (callback: (data: { game: string }) => void) => void;
  onRecordingStopped: (
    callback: (data: { scanTimestamp: number; game: string }) => void,
  ) => void;
  onNewClipsDetected: (callback: (clips: any[]) => void) => void;
  removeAllListeners: (channel: string) => void;
  test: boolean;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export default {};
