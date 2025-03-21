import React, { useState, useEffect } from "react";
import styles from "./Clips.module.css";
import ClipItem from "./ClipItem";
import { Tv, ChevronLeft, ChevronRight } from "lucide-react";
import ClipsSkeleton from "../skeletons/ClipsSkeleton";

import FavouriteButton from "./icons/StarButton.jsx";
import { useClips } from "../contexts/ClipsContext.jsx";

const Clips = React.memo(({ setView }) => {
  const { filteredClips, games, filter, updateFilter } = useClips();

  const [showGames, setShowGames] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const clipsPerPage = 36;
  const indexOfLastClip = currentPage * clipsPerPage;
  const indexOfFirstClip = indexOfLastClip - clipsPerPage;
  const currentClips = filteredClips.slice(indexOfFirstClip, indexOfLastClip);
  const totalPages = Math.ceil(filteredClips.length / clipsPerPage);

  useEffect(() => {
    setCurrentPage(1);
    handlePageChange(1);
  }, [filter, filteredClips]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const tagName = document.activeElement.tagName.toLowerCase();
      if (tagName === "input" || tagName === "textarea") return;

      if (e.key === "ArrowLeft" && currentPage > 1) {
        handlePageChange(currentPage - 1);
      } else if (e.key === "ArrowRight" && currentPage < totalPages) {
        handlePageChange(currentPage + 1);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentPage, totalPages]);

  const handleFilterClick = () => {
    setShowGames(!showGames);
  };

  const handleGameClick = (game) => {
    updateFilter({
      game: game === filter.game ? "All" : game,
    });
    setShowGames(false);
  };

  const handlePageChange = (newPage) => {
    localStorage.setItem("page", JSON.stringify(newPage));
    setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  const PaginationControls = () => (
    <div className={styles.pagination}>
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft size={16} />
      </button>

      <span>
        {currentPage} / {totalPages}
      </span>

      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );

  useEffect(() => {
    const storedPosition = localStorage.getItem("position");
    const storedPage = localStorage.getItem("page");

    if (storedPosition) {
      document.documentElement.scrollTop = JSON.parse(storedPosition);
    }
    if (storedPage) {
      setCurrentPage(+storedPage);
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
          <FavouriteButton active={filter.showFavourites} size={18} />
          <p>Show Favourites</p>
        </button>
      </div>

      {games.length > 0 && (
        <div className={styles.clipGrid}>
          {currentClips.map((clip) => (
            <ClipItem key={clip.filePath} clip={clip} setView={setView} />
          ))}

          {filteredClips.length === 0 && (
            <div className={styles.noClips}>
              No clips found. Try adjusting your filters.
            </div>
          )}
        </div>
      )}
      {games.length === 0 && (
        <div className={styles.clipGrid}>
          {Array.from({ length: 10 }).map((_, index) => (
            <ClipsSkeleton index={index} key={index} />
          ))}
        </div>
      )}

      {filteredClips.length > clipsPerPage && <PaginationControls />}
    </div>
  );
});

export default Clips;
