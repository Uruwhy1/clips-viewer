import { createContext, useState, useMemo, useEffect } from "react";
import { getAllClips } from "../helpers/readFilesFromDirectory";
import { saveFavourites } from "../helpers/externalFiles";

const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const gamesDir = "E:/Clips";
  const [allClips, setAllClips] = useState([]);
  const [currentClip, setCurrentClip] = useState(null);
  const [favourites, setFavourites] = useState(new Set());

  useEffect(() => {
    (async () => {
      const [favouritesSet, initialClips] = await getAllClips(gamesDir);
      setAllClips(initialClips);
      setCurrentClip(initialClips[0]);
      setFavourites(favouritesSet);
    })();
  }, []);

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

  const contextValue = useMemo(
    () => ({
      allClips,
      currentClip,
      setCurrentClip,
      setAllClips,
      toggleFavourite,
    }),
    [allClips, currentClip, favourites]
  );

  return (
    <GlobalContext.Provider value={contextValue}>
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalContext;
