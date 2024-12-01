import React, { useState, useContext, useEffect } from "react";
import GlobalContext from "../contexts/GlobalContext";
import styles from "./Clips.module.css";

import ClipItem from "./ClipItem";

const Clips = () => {
  const { allClips, toggleFavourite } = useContext(GlobalContext);
  const [clips, setClips] = useState(allClips);
  const [filter, setFilter] = useState({
    game: "All",
    showFavourites: false,
  });

  useEffect(() => {
    const filteredClips = allClips
      .filter(
        (clip) =>
          (filter.game === "All" || clip.game === filter.game) &&
          (!filter.showFavourites || clip.isFavourite)
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    setClips(filteredClips);
  }, [allClips, filter]);

  return (
    <div className={styles.container}>
      <div className={styles.filters}>
        <button
          className={filter.game === "All" ? styles.active : ""}
          onClick={() => setFilter((prev) => ({ ...prev, game: "All" }))}
        >
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
          <p>All</p>
        </button>
        <button
          className={filter.showFavourites ? styles.active : ""}
          onClick={() =>
            setFilter((prev) => ({
              ...prev,
              showFavourites: !prev.showFavourites,
            }))
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="gold"
            stroke="gold"
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
        {clips.map((clip) => (
          <ClipItem key={clip.filePath} clip={clip} />
        ))}

        {clips.length === 0 && (
          <div className={styles.noClips}>
            No clips found. Try adjusting your filters.
          </div>
        )}
      </div>
    </div>
  );
};

export default Clips;
