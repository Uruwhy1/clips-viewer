import React, { useContext, useEffect } from "react";
import GlobalContext from "../contexts/GlobalContext";
import styles from "./Clips.module.css";

import ClipItem from "./ClipItem";

const Clips = () => {
  const { filteredClips, games, filter, updateFilter } =
    useContext(GlobalContext);

  const [showGames, setShowGames] = React.useState(false);

  const handleFilterClick = () => {
    setShowGames(!showGames);
  };

  const handleGameClick = (game) => {
    updateFilter({
      game: game === filter.game ? "All" : game,
    });
    setShowGames(false);
  };

  useEffect(() => {
    const storedPosition = localStorage.getItem("position");

    if (storedPosition) {
      document.documentElement.scrollTop = JSON.parse(storedPosition);
    }

    const handleScroll = () => {
      const pagePosition = document.documentElement.scrollTop;
      localStorage.setItem("position", JSON.stringify(pagePosition));
    };

    document.addEventListener("scroll", handleScroll);
    return () => {
      document.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className={styles.container}>
      {showGames && <div className={styles.cover}></div>}
      <div className={styles.filters}>
        <div>
          <button onClick={handleFilterClick}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
              <polyline points="17 2 12 7 7 2"></polyline>
            </svg>
            <p>{filter.game}</p>
          </button>
          {showGames && (
            <div className={styles.gamesList}>
              {games.map((game) => (
                <button
                  key={game}
                  className={filter.game === game ? styles.active : ""}
                  onClick={() => handleGameClick(game)}
                >
                  {game}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          className={filter.showFavourites ? styles.active : ""}
          onClick={() =>
            updateFilter({
              showFavourites: !filter.showFavourites,
            })
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="inherit"
            stroke="inherit"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
          <p>Show Favourites</p>
        </button>
      </div>

      <div className={styles.clipGrid}>
        {filteredClips.map((clip) => (
          <ClipItem key={clip.filePath} clip={clip} />
        ))}

        {filteredClips.length === 0 && (
          <div className={styles.noClips}>
            No clips found. Try adjusting your filters.
          </div>
        )}
      </div>
    </div>
  );
};

export default Clips;
