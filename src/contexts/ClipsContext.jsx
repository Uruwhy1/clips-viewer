import {
  createContext,
  useState,
  useEffect,
  useMemo,
  useContext,
  useCallback,
} from "react";
import { getAllClips } from "../helpers/readFilesFromDirectory";
import { renameClipFile, deleteClipFile } from "../helpers/externalFiles";
import { useSettings } from "./SettingsContext";
import { useFavorites } from "./FavoritesContext";

const ClipsContext = createContext();

export const ClipsProvider = ({ children }) => {
  const { settings } = useSettings();
  const { favorites, toggleFavourite, updateFavoritePath } = useFavorites();

  const [allClips, setAllClips] = useState([]);
  const [currentClip, setCurrentClip] = useState(null);
  const [filter, setFilter] = useState({
    game: "All",
    showFavourites: false,
  });

  // Load clips when games directory changes
  useEffect(() => {
    const fetchClips = async () => {
      if (settings.gamesDir) {
        const [_, initialClips] = await getAllClips(settings.gamesDir);

        // Mark favorites in clips
        const clipsWithFavorites = initialClips.map((clip) => ({
          ...clip,
          isFavourite: favorites.has(clip.filePath),
        }));

        setAllClips(clipsWithFavorites);
        if (clipsWithFavorites.length > 0 && !currentClip) {
          setCurrentClip(clipsWithFavorites[0]);
        }
      }
    };

    fetchClips();
  }, [settings.gamesDir, favorites]);

  // Filtered clips calculation
  const filteredClips = useMemo(() => {
    return allClips
      .filter(
        (clip) =>
          (filter.game === "All" || clip.game === filter.game) &&
          (!filter.showFavourites || clip.isFavourite)
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [allClips, filter]);

  // Unique games calculation
  const games = useMemo(() => {
    const filteredClipsForGames = filter.showFavourites
      ? allClips.filter((clip) => clip.isFavourite)
      : allClips;

    return Array.from(new Set(filteredClipsForGames.map((clip) => clip.game)));
  }, [allClips, filter]);

  const addClip = (newClip) => {
    setAllClips((prevClips) => [newClip, ...prevClips]);
  };

  const editClip = async (clip, newTitle) => {
    const oldPath = clip.filePath;
    const isFavourite = favorites.has(oldPath);

    if (!newTitle || newTitle.trim() === "") {
      alert("Edit canceled or invalid name.");
      return false;
    }

    try {
      const { newPath, newName } = await renameClipFile(oldPath, newTitle);

      if (isFavourite) {
        await updateFavoritePath(oldPath, newPath);
      }

      setAllClips((prevClips) =>
        prevClips.map((c) =>
          c.filePath === oldPath
            ? {
                ...c,
                filePath: newPath,
                name: newName,
                isFavourite: isFavourite,
              }
            : c
        )
      );

      if (currentClip && currentClip.filePath === oldPath) {
        setCurrentClip({
          ...currentClip,
          filePath: newPath,
          name: newName,
          isFavourite: isFavourite,
        });
      }

      return true;
    } catch (error) {
      console.error("Error renaming clip:", error);
      return false;
    }
  };

  const deleteClip = useCallback(
    async (clipPath, isFavourite) => {
      const success = await deleteClipFile(clipPath);
      if (!success) {
        console.error("Failed to delete clip file.");
        return false;
      }

      setAllClips((prevClips) => {
        const newClips = prevClips.filter((clip) => clip.filePath !== clipPath);

        // Update current clip if the deleted clip was selected
        if (currentClip && currentClip.filePath === clipPath) {
          const newCurrentClip = newClips[0] || null;
          setCurrentClip(newCurrentClip);
        }

        return newClips;
      });

      if (isFavourite) {
        toggleFavourite(clipPath);
      }

      return true;
    },
    [currentClip]
  );

  const updateFilter = (newFilter) => {
    setFilter((prev) => ({
      ...prev,
      ...newFilter,
    }));
  };

  const contextValue = {
    allClips,
    filteredClips,
    currentClip,
    setCurrentClip,
    games,
    filter,
    updateFilter,
    addClip,
    editClip,
    deleteClip,
  };

  return (
    <ClipsContext.Provider value={contextValue}>
      {children}
    </ClipsContext.Provider>
  );
};

export const useClips = () => {
  const context = useContext(ClipsContext);
  if (!context) {
    throw new Error("useClips must be used within a ClipsProvider");
  }
  return context;
};

export default ClipsContext;
