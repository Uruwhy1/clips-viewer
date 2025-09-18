import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import { documentDir, join } from "@tauri-apps/api/path";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useSettings } from "./SettingsContext";
import { useClips } from "./ClipsContext";
import { getName } from "@tauri-apps/api/app";

interface MediaContextType {
  coverCache: Map<string, string>;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

interface MediaProviderProps {
  children: ReactNode;
}

export const MediaProvider = ({ children }: MediaProviderProps) => {
  const { settings } = useSettings();
  const { allClips } = useClips();

  const [coverCache, setCoverCache] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const cacheCovers = async () => {
      if (!settings.gamesDir || allClips.length === 0) return;

      const newCache = new Map();
      const uniqueGames = new Set(allClips.map((clip) => clip.game));

      const appName = await getName();
      const docsDir = await documentDir();
      for (const game of uniqueGames) {
        try {
          const coverPath = await join(
            docsDir,
            appName,
            "game_covers",
            `${game}.jpg`,
          );
          newCache.set(game, convertFileSrc(coverPath));
        } catch (error) {
          console.error(`Error caching cover for ${game}:`, error);
        }
      }

      const defaultPath = await join(
        docsDir,
        appName,
        "game_covers",
        `default.jpg`,
      );

      newCache.set("default", convertFileSrc(defaultPath));

      setCoverCache(newCache);
    };

    cacheCovers();
  }, [allClips, settings.gamesDir]);

  const contextValue = {
    coverCache,
  };

  return (
    <MediaContext.Provider value={contextValue}>
      {children}
    </MediaContext.Provider>
  );
};

export const useMedia = () => {
  const context = useContext(MediaContext);
  if (!context) {
    throw new Error("useMedia must be used within a MediaProvider");
  }
  return context;
};

export default MediaContext;
