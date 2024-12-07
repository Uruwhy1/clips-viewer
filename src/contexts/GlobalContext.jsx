import { createContext, useState, useMemo, useEffect } from "react";
import { getAllClips } from "../helpers/readFilesFromDirectory";
import { saveFavourites } from "../helpers/externalFiles";
import { startGameDetection } from "../helpers/OBS";

const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const gamesDir = "E:/Clips";
  const [allClips, setAllClips] = useState([]);
  const [filter, setFilter] = useState({
    game: "All",
    showFavourites: false,
  });
  const [games, setGames] = useState([]);
  const [favourites, setFavourites] = useState(new Set());

  useEffect(() => {
    (async () => {
      const [favouritesSet, initialClips] = await getAllClips(gamesDir);
      setAllClips(initialClips);
      setCurrentClip(initialClips[0]);
      setFavourites(favouritesSet);

      startGameDetection();
    })();
  }, []);

  useEffect(() => {
    const gamesList = Array.from(new Set(allClips.map((clip) => clip.game)));
    setGames(gamesList);
  }, [allClips]);

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

  const [currentClip, setCurrentClip] = useState(null);

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
    }),
    [allClips, currentClip, favourites, filter]
  );

  return (
    <GlobalContext.Provider value={contextValue}>
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalContext;
