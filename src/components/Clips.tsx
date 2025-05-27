import React, { useState, useEffect, useCallback, useMemo } from "react";
import styles from "./Clips.module.css";
import ClipItem from "./ClipItem";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ClipsSkeleton from "../skeletons/ClipsSkeleton";
import FavouriteButton from "./icons/StarButton";
import { useClips } from "../contexts/ClipsContext";
import { usePagination } from "../hooks/usePagination";
import GameFilter from "./GameFilter";
import { Clip } from "../types/clip";
import { useSettings } from "../contexts/SettingsContext";

const CLIPS_PER_PAGE = 36;

type Clips = {
  setView: (view: string) => void;
};

const Clips: React.FC<Clips> = React.memo(({ setView }) => {
  const { filteredClips, games, filter, updateFilter } = useClips();
  const [showGames, setShowGames] = useState<boolean>(false);
  const { settings } = useSettings();

  const {
    currentPage,
    totalPages,
    currentItems: currentClips,
    goToPage,
  } = usePagination(filteredClips, CLIPS_PER_PAGE);

  const handleFilterClick = useCallback(() => {
    setShowGames((prev) => !prev);
  }, []);

  const handleGameClick = useCallback(
    (game: string) => {
      updateFilter({
        game: game === filter.game ? "All" : game,
      });
      setShowGames(false);
    },
    [filter.game, updateFilter]
  );

  const toggleFavorites = useCallback(() => {
    updateFilter({
      showFavourites: !filter.showFavourites,
    });
  }, [filter.showFavourites, updateFilter]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement) {
        const tagName = document.activeElement.tagName.toLowerCase();
        if (tagName === "input" || tagName === "textarea") return;

        if (e.key === "ArrowLeft" && currentPage > 1) {
          goToPage(currentPage - 1);
        } else if (e.key === "ArrowRight" && currentPage < totalPages) {
          goToPage(currentPage + 1);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, totalPages, goToPage]);

  const PaginationControls = useMemo(() => {
    if (filteredClips.length <= CLIPS_PER_PAGE) return null;

    return (
      <div className={styles.pagination}>
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft size={16} />
        </button>

        <span>
          {currentPage} / {totalPages}
        </span>

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    );
  }, [currentPage, totalPages, goToPage, filteredClips.length]);

  return (
    <div className={styles.container}>
      {showGames && (
        <div className={styles.cover} onClick={() => setShowGames(false)}></div>
      )}

      <div className={styles.filters}>
        <GameFilter
          showGames={showGames}
          currentGame={filter.game}
          games={games}
          onFilterClick={handleFilterClick}
          onGameClick={handleGameClick}
        />

        <button
          className={filter.showFavourites ? styles.active : ""}
          onClick={toggleFavorites}
        >
          <FavouriteButton active={filter.showFavourites} size={18} />
          <p>Show Favourites</p>
        </button>
      </div>

      {!settings.gamesDir ? (
        <div className={styles.noClips}>
          No games directory set. Please configure your settings.
        </div>
      ) : games.length > 0 ? (
        <div className={styles.clipGrid}>
          {currentClips.map((clip: Clip) => (
            <ClipItem key={clip.filePath} clip={clip} setView={setView} />
          ))}

          {filteredClips.length === 0 && (
            <div className={styles.noClips}>
              No clips found. Try adjusting your filters.
            </div>
          )}
        </div>
      ) : (
        <div className={styles.clipGrid}>
          {Array.from({ length: 10 }).map((_, index) => (
            <ClipsSkeleton key={index} />
          ))}
        </div>
      )}

      {PaginationControls}
    </div>
  );
});

export default Clips;
