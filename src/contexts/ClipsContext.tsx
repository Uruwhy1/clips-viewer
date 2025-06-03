import {
  createContext,
  useState,
  useEffect,
  useMemo,
  useContext,
  useCallback,
  ReactNode,
} from "react";
import { getAllClips } from "../helpers/readFilesFromDirectory";
import { renameClipFile, deleteClipFile } from "../helpers/externalFiles";
import { useSettings } from "./SettingsContext";
import { useFavorites } from "./FavoritesContext";
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
    newFilter: Partial<{ game: string; showFavourites: boolean }>
  ) => void;
  addClip: (newClip: Clip) => void;
  editClip: (clip: Clip, newTitle: string) => Promise<boolean>;
  deleteClip: (clipPath: string, isFavourite: boolean) => Promise<boolean>;
}

const ClipsContext = createContext<ClipsContextType | undefined>(undefined);

interface ClipsProviderProps {
  children: ReactNode;
}

export const ClipsProvider = ({ children }: ClipsProviderProps) => {
  const { settings } = useSettings();
  const { isFavorite, toggleFavourite, updateFavoritePath } = useFavorites();

  const [allClips, setAllClips] = useState<Clip[]>([]);
  const [currentClip, setCurrentClip] = useState<Clip | null>(null);

  const [filter, setFilter] = useState<{
    game: string;
    showFavourites: boolean;
  }>({
    game: "All",
    showFavourites: false,
  });

  // Load clips when games directory changes
  useEffect(() => {
    const fetchClips = async () => {
      if (settings.gamesDir) {
        const [_, initialClips] = await getAllClips(settings.gamesDir);

        setAllClips(initialClips);
        if (initialClips.length > 0 && !currentClip) {
          setCurrentClip(initialClips[0]);
        }
      }
    };

    fetchClips();
  }, [settings.gamesDir]);

  // Filtered clips calculation
  const filteredClips = useMemo(() => {
    return allClips
      .filter(
        (clip) =>
          (filter.game === "All" || clip.game === filter.game) &&
          (!filter.showFavourites || clip.isFavourite)
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

  const addClip = (newClip: Clip) => {
    setAllClips((prevClips) => [newClip, ...prevClips]);
  };

  const editClip = async (clip: Clip, newTitle: string): Promise<boolean> => {
    const oldPath = clip.filePath;
    const isFavourite = isFavorite(oldPath);

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
    async (clipPath: string, isFavourite: boolean): Promise<boolean> => {
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
    [currentClip, toggleFavourite]
  );

  const updateFilter = (
    newFilter: Partial<{ game: string; showFavourites: boolean }>
  ) => {
    setFilter((prev) => ({
      ...prev,
      ...newFilter,
    }));
  };

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
