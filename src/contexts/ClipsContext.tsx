import {
  createContext,
  useState,
  useEffect,
  useMemo,
  useContext,
  useCallback,
  ReactNode,
  useRef,
} from "react";
import { getAllClips } from "../helpers/readFilesFromDirectory";
import {
  renameClipFile,
  deleteClipFile,
  saveFavourites,
} from "../helpers/externalFiles";
import { useSettings } from "./SettingsContext";
import { Clip } from "../types/clip";

interface ClipsContextType {
  allClips: Clip[];
  setAllClips: React.Dispatch<React.SetStateAction<Clip[]>>;
  filteredClips: Clip[];
  currentClip: Clip | null;
  setCurrentClip: (clip: Clip | null) => void;
  games: string[];
  filter: {
    game: string;
    showFavourites: boolean;
  };
  updateFilter: (
    newFilter: Partial<{ game: string; showFavourites: boolean }>,
  ) => void;
  addClip: (newClip: Clip) => void;
  editClip: (clip: Clip, newTitle: string) => Promise<boolean>;
  deleteClip: (clipPath: string, isFavourite: boolean) => Promise<boolean>;

  favorites: Set<string>;
  toggleFavourite: (clipPath: string) => void;
  updateFavoritePath: (oldPath: string, newPath: string) => void;
  isFavorite: (clipPath: string) => boolean;

  randomClips: Clip[];
}

const ClipsContext = createContext<ClipsContextType | undefined>(undefined);

interface ClipsProviderProps {
  children: ReactNode;
}

export const ClipsProvider = ({ children }: ClipsProviderProps) => {
  const { settings } = useSettings();

  const [allClips, setAllClips] = useState<Clip[]>([]);
  const [currentClip, setCurrentClip] = useState<Clip | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const loadedClips = useRef(false);

  const [filter, setFilter] = useState<{
    game: string;
    showFavourites: boolean;
  }>({
    game: "All",
    showFavourites: false,
  });

  useEffect(() => {
    const fetchClips = async () => {
      if (settings.gamesDir) {
        const [favouritesSet, initialClips] = await getAllClips(
          settings.gamesDir,
        );

        setFavorites(favouritesSet);

        const clipsWithFavorites = initialClips.map((clip) => ({
          ...clip,
          isFavourite: favouritesSet.has(clip.filePath),
        }));

        setAllClips(clipsWithFavorites);
        loadedClips.current = true;

        const now = Math.floor(Date.now() / 1000);
        localStorage.setItem("lastCheckedTimestamp", now.toString());

        if (clipsWithFavorites.length > 0 && !currentClip) {
          setCurrentClip(clipsWithFavorites[0]);
        }
      }
    };

    fetchClips();
  }, [settings.gamesDir]);

  const filteredClips = useMemo(() => {
    return allClips
      .filter(
        (clip) =>
          (filter.game === "All" || clip.game === filter.game) &&
          (!filter.showFavourites || clip.isFavourite),
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allClips, filter]);

  // Unique games calculation
  const games = useMemo(() => {
    const filteredClipsForGames = filter.showFavourites
      ? allClips.filter((clip) => clip.isFavourite)
      : allClips;

    return Array.from(new Set(filteredClipsForGames.map((clip) => clip.game)));
  }, [allClips, filter]);

  // Random clips for recommendations
  const randomClips = useMemo(() => {
    if (!allClips.length || !currentClip || !loadedClips.current) return [];

    const availableClips = allClips.filter(
      (clip) =>
        clip.filePath !== currentClip?.filePath && favorites.has(clip.filePath),
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
  }, [allClips, currentClip, favorites, loadedClips.current]);

  const addClip = (newClip: Clip) => {
    setAllClips((prevClips) => [newClip, ...prevClips]);
  };

  const editClip = async (clip: Clip, newTitle: string): Promise<boolean> => {
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
            : c,
        ),
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
    async (clipPath: string, isFavourite: boolean): Promise<boolean> => {
      const success = await deleteClipFile(clipPath);
      if (!success) {
        console.error("Failed to delete clip file.");
        return false;
      }

      setAllClips((prevClips) => {
        const newClips = prevClips.filter((clip) => clip.filePath !== clipPath);

        if (currentClip && currentClip.filePath === clipPath) {
          const newCurrentClip = newClips[5] || null;
          setCurrentClip(newCurrentClip);
        }

        return newClips;
      });

      if (isFavourite) {
        toggleFavourite(clipPath);
      }

      return true;
    },
    [currentClip],
  );

  const updateFilter = (
    newFilter: Partial<{ game: string; showFavourites: boolean }>,
  ) => {
    setFilter((prev) => ({
      ...prev,
      ...newFilter,
    }));
  };

  // favorites methods
  const toggleFavourite = async (clipPath: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(clipPath)) {
      newFavorites.delete(clipPath);
    } else {
      newFavorites.add(clipPath);
    }

    await saveFavourites(newFavorites);
    setFavorites(newFavorites);

    setAllClips((prevClips) =>
      prevClips.map((clip) =>
        clip.filePath === clipPath
          ? { ...clip, isFavourite: newFavorites.has(clipPath) }
          : clip,
      ),
    );

    return newFavorites.has(clipPath);
  };

  const updateFavoritePath = async (oldPath: string, newPath: string) => {
    const newFavorites = new Set(favorites);
    newFavorites.delete(oldPath);
    newFavorites.add(newPath);

    await saveFavourites(newFavorites);
    setFavorites(newFavorites);

    return true;
  };

  const isFavorite = (clipPath: string) => favorites.has(clipPath);

  const contextValue: ClipsContextType = {
    allClips,
    setAllClips,
    filteredClips,
    currentClip,
    setCurrentClip,
    games,
    filter,
    updateFilter,
    addClip,
    editClip,
    deleteClip,
    favorites,
    toggleFavourite,
    updateFavoritePath,
    isFavorite,
    randomClips,
  };

  return (
    <ClipsContext.Provider value={contextValue}>
      {children}
    </ClipsContext.Provider>
  );
};

export const useClips = (): ClipsContextType => {
  const context = useContext(ClipsContext);
  if (!context) {
    throw new Error("useClips must be used within a ClipsProvider");
  }
  return context;
};

export default ClipsContext;
