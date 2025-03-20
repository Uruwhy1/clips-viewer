import {
  createContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useContext,
  useRef,
} from "react";
import { documentDir, join } from "@tauri-apps/api/path";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useSettings } from "./SettingsContext";
import { useClips } from "./ClipsContext";
import { useFavorites } from "./FavoritesContext";

const MediaContext = createContext();

export const MediaProvider = ({ children }) => {
  const { settings } = useSettings();
  const { allClips, currentClip } = useClips();
  const { favorites } = useFavorites();

  const [coverCache, setCoverCache] = useState(new Map());
  const [thumbnails, setThumbnails] = useState({});
  const [processingVideos, setProcessingVideos] = useState(new Set());

  const loadedClips = useRef(false);

  useEffect(() => {
    if (allClips.length > 0 && !loadedClips.current) {
      loadedClips.current = true;
    }
  }, [allClips]);

  useEffect(() => {
    const cacheCovers = async () => {
      if (!settings.gamesDir || allClips.length === 0) return;

      const newCache = new Map();
      const uniqueGames = new Set(allClips.map((clip) => clip.game));

      for (const game of uniqueGames) {
        try {
          const docsDir = await documentDir();
          const coverPath = await join(
            docsDir,
            "Tauri",
            "game_covers",
            `${game}.jpg`
          );
          newCache.set(game, convertFileSrc(coverPath));
        } catch (error) {
          console.error(`Error caching cover for ${game}:`, error);
        }
      }

      setCoverCache(newCache);
    };

    cacheCovers();
  }, [allClips, settings.gamesDir]);

  // Generate thumbnails for videos
  const generateThumbnail = useCallback(
    async (videoPath) => {
      if (processingVideos.has(videoPath) || thumbnails[videoPath]) return;

      setProcessingVideos((prev) => new Set(prev).add(videoPath));

      try {
        const video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.src = convertFileSrc(videoPath);

        await new Promise((resolve, reject) => {
          video.onloadedmetadata = () => {
            // 20% or 5 seconds
            const seekTime = Math.min(video.duration * 0.2, 5);
            video.currentTime = seekTime;

            video.onseeked = () => {
              try {
                const canvas = document.createElement("canvas");
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                const dataUrl = canvas.toDataURL("image/jpeg", 0.35);
                setThumbnails((prev) => ({ ...prev, [videoPath]: dataUrl }));

                resolve();
              } catch (e) {
                reject(e);
              }
            };

            video.onerror = reject;
          };

          video.onerror = reject;
          video.load();
        });
      } catch (error) {
        console.error("Failed to generate thumbnail for:", videoPath, error);
      } finally {
        setProcessingVideos((prev) => {
          const newSet = new Set(prev);
          newSet.delete(videoPath);
          return newSet;
        });
      }
    },
    [processingVideos, thumbnails]
  );

  const randomClips = useMemo(() => {
    if (!allClips.length || !currentClip) return [];

    const availableClips = allClips.filter(
      (clip) =>
        clip.filePath !== currentClip?.filePath && favorites.has(clip.filePath)
    );

    if (availableClips.length === 0) return [];

    const randomSelected = [];
    const maxClips = Math.min(6, availableClips.length);
    const clipsCopy = [...availableClips];

    for (let i = 0; i < maxClips; i++) {
      const randomIndex = Math.floor(Math.random() * clipsCopy.length);
      randomSelected.push(clipsCopy[randomIndex]);
      clipsCopy.splice(randomIndex, 1);
    }

    return randomSelected;
  }, [loadedClips.current]);

  useEffect(() => {
    if (randomClips.length === 0) return;

    setTimeout(() => {
      randomClips.forEach((clip) => {
        if (!thumbnails[clip.filePath]) {
          generateThumbnail(clip.filePath);
        }
      });
    }, 1000);
  }, [randomClips, thumbnails, generateThumbnail]);

  const contextValue = {
    coverCache,
    thumbnails,
    generateThumbnail,
    randomClips,
    getVideoSrc: (path) => convertFileSrc(path),
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
