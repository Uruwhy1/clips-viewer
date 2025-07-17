type GameConfig = {
  processes: string[];
  record: boolean;
  windowTitle?: string;
};

export type GamesConfig = {
  [gameName: string]: GameConfig;
};

export type OBSSettings = {
  port: string | null;
  password: string | null;
};

export type RecordingMethod = "obs";
export type Settings = {
  gamesDir: string | null;
  gamesConfig: GamesConfig;
  scrollbarOff: boolean;
  clipsDeleteThreshold: number;
  clipDeletion: boolean;
  obs: OBSSettings;
  theme: string;
  accentVariable: string;
  recordingSoundEnabled: boolean;
  recordingMethod: RecordingMethod;
};

export type SemanticColor = {
  name: string;
  variable: string;
  previewColor: string;
};

export type ThemeModeType = "Dark" | "Light" | "System";
export type ThemeFamily = "Catppuccin";
