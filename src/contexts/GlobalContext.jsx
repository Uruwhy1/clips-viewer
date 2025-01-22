import { createContext, useState, useMemo, useEffect, useRef } from "react";
import { getAllClips } from "../helpers/readFilesFromDirectory";
import { saveFavourites } from "../helpers/externalFiles";
import { startGameDetection } from "../helpers/OBS";
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

  useEffect(() => {
    const load = async () => {
      await loadSettings(setSettings);
      setLoadedSettings(true);
    };

    load();
  }, []);

  useEffect(() => {
    settingsRef.current = settings;
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
        startGameDetection(settingsRef);
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
    setCurrentClip(newClip);
  };

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
      updateFilter,
      addClip,
      setCurrentClip,
      setAllClips,
      toggleFavourite,
      setSettings,
      settings,
      coverCache,
    }),
    [allClips, currentClip, filteredClips, games, filter, settings, favourites]
  );

  return (
    <GlobalContext.Provider value={contextValue}>
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalContext;
