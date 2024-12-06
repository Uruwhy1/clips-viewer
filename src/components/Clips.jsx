import React, { useContext, useEffect } from "react";
import GlobalContext from "../contexts/GlobalContext";
import styles from "./Clips.module.css";

import ClipItem from "./ClipItem";
import { Star, Tv } from "lucide-react";

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
            <Tv size={17} />
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
          <Star size={18} className={styles.favouritesButton} />
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
