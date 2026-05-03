import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";

import { useSettings } from "./SettingsContext";
import { OBSSettings, RecordingMethod } from "../types/settings";
import { connectOBS } from "../helpers/OBS";

interface ConnectionState {
  status: "disconnected" | "connected" | "error";
  version: string | null;
  error: string | null;
}

interface RecordingContextValue {
  connection: ConnectionState;
  connect: (port: string, password: string) => Promise<boolean>;
  obsSetting: OBSSettings;
  setObsSetting: (settings: OBSSettings) => void;
  startGameDetection: () => void;
  gameDetectionRunning: boolean;
  recordingMethod: RecordingMethod;
}

const RecordingContext = createContext<RecordingContextValue | undefined>(undefined);

interface RecordingProviderProps {
  children: ReactNode;
}

export const RecordingProvider = ({ children }: RecordingProviderProps) => {
  const { settings } = useSettings();

  const [connection, setConnection] = useState<ConnectionState>({
    status: "disconnected",
    version: null,
    error: null,
  });

  const [obsSetting, setObsSetting] = useState<OBSSettings>({
    port: null,
    password: null,
  });

  const [gameDetectionRunning, setGameDetectionRunning] = useState(false);

  const recordingSoundEnabled = settings.recordingSoundEnabled;

  const playRecordingSound = () => {
    const audio = new Audio("assets/beep.mp3");
    audio.play().catch(() => {});
  };

  const playStopSound = () => {
    const audio = new Audio("assets/beep.mp3");
    audio.play().catch(() => {});
  };

  useEffect(() => {
    if (settings.obs) {
      setObsSetting(settings.obs);
    }
  }, [settings.obs]);

  useEffect(() => {
    const initialize = async () => {
      try {
        if (
          settings.recordingMethod === "obs" &&
          obsSetting.port &&
          obsSetting.password
        ) {
          await connectFn(obsSetting.port, obsSetting.password);
        }
      } catch (error) {
        console.error("Failed to initialize recording context:", error);
      }
    };

    initialize();
  }, [obsSetting, settings.recordingMethod]);

  const connectFn = async (port: string, password: string): Promise<boolean> => {
    if (settings.recordingMethod !== "obs") return false;

    const result = await connectOBS(port, password);
    if (result.success) {
      setConnection({
        status: "connected",
        version: result.version ?? null,
        error: null,
      });
      setGameDetectionRunning(true);
      return true;
    } else {
      setConnection({
        status: "error",
        version: null,
        error: result.error ?? "Unknown error",
      });
      return false;
    }
  };

  const startGameDetectionFn = () => {
    if (connection.status !== "connected") {
      console.log("[Renderer] Cannot start game detection - not connected to OBS");
      return;
    }

    console.log("[Renderer] Setting up IPC listeners for game detection...");

    window.electron.onStartRecording(async () => {
      console.log("[Renderer] Received start-obs-recording IPC event");
      console.log("[Renderer] Recording sound enabled:", recordingSoundEnabled);
      if (recordingSoundEnabled) {
        playRecordingSound();
      }
      try {
        console.log("[Renderer] Calling window.electron.startOBSRecording...");
        const result = await window.electron.startOBSRecording("", false);
        console.log("[Renderer] startOBSRecording result:", result);
        if (result.success) {
          console.log("[Renderer] OBS recording started successfully");
        } else {
          console.error("[Renderer] Failed to start OBS recording:", result.message);
        }
      } catch (error) {
        console.error("[Renderer] Error starting OBS recording:", error);
      }
    });

    window.electron.onStopRecording(async (data: { scanTimestamp: number; game: string }) => {
      console.log("[Renderer] Received stop-obs-recording IPC event");
      if (recordingSoundEnabled) {
        playStopSound();
      }
      try {
        console.log("[Renderer] Calling window.electron.stopOBSRecording...");
        const result = await window.electron.stopOBSRecording(false);
        console.log("[Renderer] stopOBSRecording result:", result);
        if (result.success) {
          console.log("[Renderer] OBS recording stopped successfully");
          console.log("[Renderer] Scanning for new clips in 3 seconds...");
          setTimeout(async () => {
            console.log("[Renderer] Triggering new clips scan for game:", data.game);
            const newClips = await window.electron.scanForNewClips(data.scanTimestamp, data.game);
            console.log("[Renderer] Scan complete, found", newClips.length, "new clips");
            if (newClips.length > 0) {
              window.dispatchEvent(
                new CustomEvent("newClipsDetected", { detail: newClips })
              );
            }
          }, 3000);
        } else {
          console.error("[Renderer] Failed to stop OBS recording:", result.message);
        }
      } catch (error) {
        console.error("[Renderer] Error stopping OBS recording:", error);
      }
    });

    console.log("[Renderer] Game detection listeners registered");
    setGameDetectionRunning(true);
  };

  useEffect(() => {
    if (connection.status === "connected") {
      startGameDetectionFn();
    }

    return () => {
      window.electron.removeAllListeners("start-obs-recording");
      window.electron.removeAllListeners("stop-obs-recording");
    };
  }, [connection.status]);

  const value: RecordingContextValue = {
    connection,
    connect: connectFn,
    obsSetting,
    setObsSetting,
    startGameDetection: startGameDetectionFn,
    gameDetectionRunning,
    recordingMethod: settings.recordingMethod,
  };

  return (
    <RecordingContext.Provider value={value}>
      {children}
    </RecordingContext.Provider>
  );
};

export const useRecording = (): RecordingContextValue => {
  const context = useContext(RecordingContext);
  if (!context) {
    throw new Error("useRecording must be used within a RecordingProvider");
  }
  return context;
};

export default RecordingContext;
