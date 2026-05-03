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
import { getAllClips, onClipLoadingProgress, removeClipLoadingProgressListener, ClipLoadingProgress } from "../helpers/readFilesFromDirectory";
import {
  renameClipFile,
  deleteClipFile,
  saveFavourites,
} from "../helpers/externalFiles";
import { useSettings } from "./SettingsContext";
import { Clip } from "../types/clip";
import { checkAndDeleteOldClips } from "../helpers/automaticClipDeletion";
import { usePopup, showPersistentNotification, removePersistentNotification } from "./PopupContext";

type AddClipResult = {
  setAsCurrent: () => void;
  setAsCurrentAndRemoveOld: () => void;
};

type SortOrder = "newest" | "oldest";

interface DateFilter {
  startDate: string | null;
  endDate: string | null;
}

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
    sortOrder: SortOrder;
    dateFilter: DateFilter;
  };
  updateFilter: (
    newFilter: Partial<{
      game: string;
      showFavourites: boolean;
      sortOrder: SortOrder;
      dateFilter: DateFilter;
    }>,
  ) => void;
  addClip: (newClip: Clip) => AddClipResult;
  editClip: (clip: Clip, newTitle: string) => Promise<boolean>;
  deleteClip: (clipPath: string, isFavourite: boolean) => Promise<boolean>;
  goToNextClip: () => void;
  goToPrevClip: () => void;
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
  const { showPopup, showPersistentNotification, removePersistentNotification } = usePopup();

  const [allClips, setAllClips] = useState<Clip[]>([]);
  const [currentClip, setCurrentClip] = useState<Clip | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const loadedClips = useRef(false);

  const [filter, setFilter] = useState<{
    game: string;
    showFavourites: boolean;
    sortOrder: SortOrder;
    dateFilter: DateFilter;
  }>({
    game: "All",
    showFavourites: false,
    sortOrder: "newest",
    dateFilter: {
      startDate: null,
      endDate: null,
    },
  });

  useEffect(() => {
    const fetchClips = async () => {
      if (settings.gamesDir) {
        showPersistentNotification("loading-clips", {
          mainText: "Loading clips...",
          progressText: [],
          progress: 0,
        });

        onClipLoadingProgress((progress: ClipLoadingProgress) => {
          const basePercent = Math.round(((progress.current - 1) / progress.total) * 100);
          let percent = basePercent;
          let progressDetails: string[] = [`${progress.game}`];

          if (progress.itemsTotal && progress.itemsTotal > 0) {
            const itemPercent = Math.round((progress.itemsProcessed! / progress.itemsTotal) * 100);
            percent = Math.min(99, basePercent + Math.round(itemPercent / progress.total));
            progressDetails = [
              `${progress.game}`,
              `${progress.itemsProcessed}/${progress.itemsTotal} clips`,
            ];
          }

          showPersistentNotification("loading-clips", {
            mainText: `Loading ${progress.game} clips...`,
            progressText: progressDetails,
            progress: percent,
          });
        });

        const [favouritesSet, initialClips] = await getAllClips(
          settings.gamesDir,
        );

        removeClipLoadingProgressListener();

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

        if (settings.clipDeletion && clipsWithFavorites.length) {
          let result = await checkAndDeleteOldClips(
            settings,
            clipsWithFavorites,
            setAllClips,
          );
          console.log(result)

          if (result) showPopup(result[1], result[0]);
        }

        removePersistentNotification("loading-clips");
      }
    };

    fetchClips();
  }, [settings.gamesDir]);

  const filteredClips = useMemo(() => {
    return allClips
      .filter((clip) => {
        const gameMatch = filter.game === "All" || clip.game === filter.game;
        const favouriteMatch = !filter.showFavourites || clip.isFavourite;

        let dateMatch = true;
        if (filter.dateFilter.startDate || filter.dateFilter.endDate) {
          const d = new Date(clip.date * 1000);
          const clipDateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

          if (filter.dateFilter.startDate) {
            dateMatch =
              dateMatch && clipDateString >= filter.dateFilter.startDate;
          }

          if (filter.dateFilter.endDate) {
            dateMatch =
              dateMatch && clipDateString <= filter.dateFilter.endDate;
          }

          if (clipDateString == '2026-02-04') {
            console.log(dateMatch)
          }
        }

        return gameMatch && favouriteMatch && dateMatch;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date * 1000).getTime();
        const dateB = new Date(b.date * 1000).getTime();

        return filter.sortOrder === "newest" ? dateB - dateA : dateA - dateB;
      });
  }, [allClips, filter]);

  // Unique games calculation
  const games = useMemo(() => {
    return Array.from(
      new Set(
        allClips
          .filter((clip) => {
            if (filter.showFavourites && !clip.isFavourite) return false;

            if (filter.dateFilter.startDate || filter.dateFilter.endDate) {
              const d = new Date(clip.date * 1000);
              const clipDateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

              if (filter.dateFilter.startDate && clipDateString < filter.dateFilter.startDate) return false;
              if (filter.dateFilter.endDate && clipDateString > filter.dateFilter.endDate) return false;
            }

            return true;
          })
          .map((clip) => clip.game),
      ),
    );
  }, [allClips, filter.showFavourites, filter.dateFilter]);

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
  }, [allClips, loadedClips.current]);

  const addClip = (newClip: Clip): AddClipResult => {
    setAllClips((prevClips) => [newClip, ...prevClips]);

    const setAsCurrent = (): void => setCurrentClip(newClip);
    const setAsCurrentAndRemoveOld = async (): Promise<void> => {
      if (currentClip) {
        await deleteClip(currentClip.filePath, currentClip.isFavourite);

        setCurrentClip(newClip);
      }
    };

    return { setAsCurrent, setAsCurrentAndRemoveOld };
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
    [currentClip],
  );


  const goToNextClip = useCallback(() => {
    if (!currentClip || filteredClips.length === 0) return;

    const currentIndex = filteredClips.findIndex(
      (clip) => clip.filePath === currentClip.filePath,
    );

    if (currentIndex === -1) return;

    const nextIndex = (currentIndex + 1) % filteredClips.length;
    setCurrentClip(filteredClips[nextIndex]);
  }, [currentClip, filteredClips]);

  const goToPrevClip = useCallback(() => {
    if (!currentClip || filteredClips.length === 0) return;

    const currentIndex = filteredClips.findIndex(
      (clip) => clip.filePath === currentClip.filePath,
    );

    if (currentIndex === -1) return;

    const prevIndex =
      (currentIndex - 1 + filteredClips.length) % filteredClips.length;

    console.log(prevIndex, currentIndex)

    setCurrentClip(filteredClips[prevIndex]);
  }, [currentClip, filteredClips]);

  const updateFilter = (
    newFilter: Partial<{
      game: string;
      showFavourites: boolean;
      sortOrder: SortOrder;
      dateFilter: DateFilter;
    }>,
  ) => {
    setFilter((prev) => ({
      ...prev,
      ...newFilter,
      ...(newFilter.dateFilter && {
        dateFilter: {
          ...prev.dateFilter,
          ...newFilter.dateFilter,
        },
      }),
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
    goToNextClip,
    goToPrevClip,
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
