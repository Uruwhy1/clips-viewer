export interface ElectronAPI {
  getAllClips: () => Promise<any[]>;
  onClipLoadingProgress: (callback: (progress: { current: number; total: number; game: string; itemsTotal?: number; itemsProcessed?: number }) => void) => void;
  removeClipLoadingProgressListener: () => void;
  openFileExplorer: (filePath: string) => void;
  toggleFavourite: (filePath: string) => Promise<string[]>;
  deleteClip: (filePath: string) => Promise<boolean>;
  renameClip: (oldPath: string, newName: string) => Promise<{ newPath: string; newName: string } | null>;
connectOBS: (port: string, password: string) => Promise<{ connected: boolean; message: string }>;

  startOBSRecording: (
    currentGame: string,
    record: boolean,
  ) => Promise<{ success: boolean; message?: string }>;

  stopOBSRecording: (
    record: boolean,
  ) => Promise<{ success: boolean; message?: string }>;
  checkOBSStatus: () => Promise<{ connected: boolean; version?: string; websocketVersion?: string; message?: string }>;
  getSettings: () => Promise<any>;
  saveSettings: (settings: any) => Promise<boolean>;
  selectDirectory: () => Promise<string | null>;
  selectFile: (filters: any[]) => Promise<string | null>;
  onStartRecording: (callback: () => void) => void;
  onStopRecording: (callback: () => void) => void;
  removeAllListeners: (channel: string) => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export default {};