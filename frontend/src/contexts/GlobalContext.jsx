import { createContext, useState, useMemo, useEffect } from "react";

const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const [allClips, setAllClips] = useState([]);
  const [currentClip, setCurrentClip] = useState(null);

  useEffect(() => {
    const initialClips = [
      {
        name: "Clip 1",
        path: "../clips/xd.mp4",
        game: "League of Legends",
        isFavourite: true,
        date: "2024-11-20",
      },
      {
        name: "Clip 2",
        path: "../clips/clutch.mp4",
        game: "Fall Guys",
        isFavourite: true,
        date: "2024-11-18",
      },
      {
        name: "Clip 3",
        path: "../clips/epicwin.mp4",
        game: "Fortnite",
        isFavourite: false,
        date: "2024-11-19",
      },
      {
        name: "Clip 4",
        path: "../clips/ace.mp4",
        game: "League of Legends",
        isFavourite: true,
        date: "2024-11-17",
      },
    ];

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
