import { createContext, useState, useEffect, useContext } from "react";
import { saveFavourites } from "../helpers/externalFiles";
import { getAllClips } from "../helpers/readFilesFromDirectory";
import { useSettings } from "./SettingsContext";

const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
  const { settings } = useSettings();
  const [favorites, setFavorites] = useState(new Set());

  useEffect(() => {
    const loadFavorites = async () => {
      if (settings.gamesDir) {
        const [favouritesSet] = await getAllClips(settings.gamesDir);
        setFavorites(favouritesSet);
      }
    };

    loadFavorites();
    console.log(favorites);
  }, [settings.gamesDir]);

  const toggleFavourite = async (clipPath) => {
    const newFavorites = new Set(favorites);

    if (newFavorites.has(clipPath)) {
      newFavorites.delete(clipPath);
    } else {
      newFavorites.add(clipPath);
    }

    await saveFavourites(newFavorites);

    setFavorites(newFavorites);
  };

  const contextValue = {
    favorites,
    toggleFavourite,
    isFavorite: (clipPath) => favorites.has(clipPath),
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
