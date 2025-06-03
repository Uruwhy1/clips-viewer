import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import { saveFavourites } from "../helpers/externalFiles";
import { getAllClips } from "../helpers/readFilesFromDirectory";
import { useSettings } from "./SettingsContext";

interface FavoritesContextProps {
  favorites: Set<string>;
  toggleFavourite: (clipPath: string) => void;
  updateFavoritePath: (oldPath: string, newPath: string) => void;
  isFavorite: (clipPath: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextProps | undefined>(
  undefined
);

interface FavouritesProviderProps {
  children: ReactNode;
}

export const FavoritesProvider = ({ children }: FavouritesProviderProps) => {
  const { settings } = useSettings();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadFavorites = async () => {
      if (settings.gamesDir) {
        const [favouritesSet] = await getAllClips(settings.gamesDir);
        setFavorites(favouritesSet);
      }
    };

    loadFavorites();
  }, [settings.gamesDir]);

  const toggleFavourite = async (clipPath: string) => {
    const newFavorites = new Set(favorites);

    if (newFavorites.has(clipPath)) {
      newFavorites.delete(clipPath);
    } else {
      newFavorites.add(clipPath);
    }

    await saveFavourites(newFavorites);

    setFavorites(newFavorites);

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

  const contextValue = {
    favorites,
    toggleFavourite,
    updateFavoritePath,
    isFavorite: (clipPath: string) => favorites.has(clipPath),
  };

  return (
    <FavoritesContext.Provider value={contextValue}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
};

export default FavoritesContext;
