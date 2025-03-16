import {
  createContext,
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { getAllClips } from "../helpers/readFilesFromDirectory";
import {
  deleteClipFile,
  saveFavourites,
  renameClipFile,
} from "../helpers/externalFiles";
import { loadSettings, saveSettings } from "../helpers/settingsFile";
import { documentDir, join } from "@tauri-apps/api/path";
import { convertFileSrc } from "@tauri-apps/api/core";

const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    gamesDir: null,
    gamesConfig: {},
  });
  const settingsRef = useRef(settings); // Create a mutable reference for settings
  const [loadedSettings, setLoadedSettings] = useState(false);
  const [allClips, setAllClips] = useState([]);
  const [filter, setFilter] = useState({
    game: "All",
    showFavourites: false,
  });
  const [favourites, setFavourites] = useState(new Set());
  const [currentClip, setCurrentClip] = useState(null);
  const [coverCache, setCoverCache] = useState(new Map());

  // Add thumbnail state and processing state
  const [thumbnails, setThumbnails] = useState({});
  const [processingVideos, setProcessingVideos] = useState(new Set());

  useEffect(() => {
    const load = async () => {
      await loadSettings(setSettings);
      setLoadedSettings(true);
    };

    load();
  }, []);

  useEffect(() => {
    settingsRef.current = settings;

    if (settings.scrollbarOff) {
      document.body.classList.add("hide-scroll");
    } else {
      document.body.classList.remove("hide-scroll");
    }
  }, [settings]);

  useEffect(() => {
    const save = async () => {
      if (loadedSettings) {
        await saveSettings(settings);
      }
    };
    save();
  }, [settings]);

  useEffect(() => {
    const fetchClips = async () => {
      if (settings.gamesDir) {
        const [favouritesSet, initialClips] = await getAllClips(
          settings.gamesDir
        );
        setAllClips(initialClips);
        setCurrentClip(initialClips[0]);
        setFavourites(favouritesSet);
      }
    };
    fetchClips();
    cacheCovers();
  }, [settings.gamesDir]);

  const cacheCovers = async () => {
    if (!settings.gamesDir) return;

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

  useEffect(() => {
    cacheCovers();
  }, [allClips, settings.gamesDir]);

  const generateThumbnail = useCallback(async (videoPath) => {
    if (processingVideos.has(videoPath)) return;

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
  }, []);

  const randomClips = useMemo(() => {
    if (!allClips.length || !currentClip) return [];

    const availableClips = allClips.filter(
      (clip) => clip.filePath !== currentClip?.filePath && clip.isFavourite
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
  }, [allClips]);

  // Generate thumbnails for random clips
  useEffect(() => {
    if (randomClips.length === 0) return;

    setTimeout(() => {
      randomClips.forEach((clip) => {
        if (!thumbnails[clip.filePath]) {
          generateThumbnail(clip.filePath);
        }
      });
    }, 1000);
  }, [randomClips]);

  // filtered clips (this is what the clips view should use)
  const filteredClips = useMemo(() => {
    return allClips
      .filter(
        (clip) =>
          (filter.game === "All" || clip.game === filter.game) &&
          (!filter.showFavourites || clip.isFavourite)
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [allClips, filter]);

  const games = useMemo(() => {
    const filteredClipsForGames = filter.showFavourites
      ? allClips.filter((clip) => clip.isFavourite)
      : allClips;

    return Array.from(new Set(filteredClipsForGames.map((clip) => clip.game)));
  }, [allClips, filter]);

  const toggleFavourite = async (clipPath) => {
    const newFavourites = new Set(favourites);

    if (newFavourites.has(clipPath)) {
      newFavourites.delete(clipPath);
    } else {
      newFavourites.add(clipPath);
    }

    await saveFavourites(newFavourites);

    setFavourites(newFavourites);

    const updatedClips = allClips.map((clip) =>
      clip.filePath === clipPath
        ? { ...clip, isFavourite: !clip.isFavourite }
        : clip
    );
    setAllClips(updatedClips);

    // update currentClip if it's the one being toggled
    if (currentClip && currentClip.filePath === clipPath) {
      setCurrentClip({
        ...currentClip,
        isFavourite: !currentClip.isFavourite,
      });
    }
  };

  const addClip = (newClip) => {
    setAllClips((prevClips) => [newClip, ...prevClips]);
  };

  const editClip = async (clip, newTitle) => {
    const oldPath = clip.filePath;
    const oldName = clip.name;

    if (!newTitle || newTitle.trim() === "") {
      alert("Edit canceled or invalid name.");
      return;
    }

    try {
      const { newPath, newName } = await renameClipFile(oldPath, newTitle);

      const updatedClips = allClips.map((c) =>
        c.filePath === oldPath ? { ...c, filePath: newPath, name: newName } : c
      );

      setAllClips(updatedClips);

      if (currentClip && currentClip.filePath === oldPath) {
        setCurrentClip({ ...currentClip, filePath: newPath, name: newName });
      }

      return true;
    } catch (error) {
      console.error("Error renaming clip:", error);
      return false;
    }
  };

  const deleteClip = useCallback(async (clipPath) => {
    const success = await deleteClipFile(clipPath);
    if (!success) {
      console.error("Failed to delete clip file.");
      return false;
    }

    setAllClips((prevClips) => {
      const newClips = prevClips.filter((clip) => clip.filePath !== clipPath);

      const newCurrentClip = newClips[0] || null;
      setCurrentClip(newCurrentClip);

      return newClips;
    });

    return true;
  }, []);

  const updateFilter = (newFilter) => {
    setFilter((prev) => ({
      ...prev,
      ...newFilter,
    }));
  };

  const contextValue = useMemo(
    () => ({
      allClips,
      currentClip,
      filteredClips,
      games,
      filter,
      deleteClip,
      updateFilter,
      addClip,
      editClip,
      setCurrentClip,
      setAllClips,
      toggleFavourite,
      setSettings,
      settings,
      loadedSettings,
      coverCache,
      // Add new thumbnail-related values to context
      thumbnails,
      generateThumbnail,
      randomClips,
    }),
    [
      allClips,
      coverCache,
      currentClip,
      filteredClips,
      games,
      filter,
      settings,
      loadedSettings,
      favourites,
      // Add dependencies for new thumbnail-related values
      thumbnails,
      generateThumbnail,
      randomClips,
    ]
  );

  return (
    <GlobalContext.Provider value={contextValue}>
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalContext;
