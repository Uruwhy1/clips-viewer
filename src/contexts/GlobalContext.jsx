import { createContext, useState, useMemo, useEffect } from "react";
import { getAllClips } from "../helpers/readFilesFromDirectory";

const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const gamesDir = "E:/Clips";

  const [allClips, setAllClips] = useState([]);
  const [currentClip, setCurrentClip] = useState(null);

  useEffect(async () => {
    const initialClips = await getAllClips(gamesDir);

    setAllClips(initialClips);
    setCurrentClip(initialClips[0]);
  }, []);

  const contextValue = useMemo(
    () => ({
      allClips,
      currentClip,
      setCurrentClip,
      setAllClips,
    }),
    [allClips, currentClip]
  );

  return (
    <GlobalContext.Provider value={contextValue}>
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalContext;
