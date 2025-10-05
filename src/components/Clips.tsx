import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import styles from "./Clips.module.css";
import ClipItem from "./ClipItem";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ClipsSkeleton from "../skeletons/ClipsSkeleton";
import { useClips } from "../contexts/ClipsContext";
import { usePagination } from "../hooks/usePagination";
import { useSettings } from "../contexts/SettingsContext";
import { Clip } from "../types/clip";
import ClipFilters from "./ClipFilters";

const CLIPS_PER_PAGE = 12;
const CLIP_HEIGHT = 300;

type Clips = {
  setView: (view: string) => void;
};

const Clips: React.FC<Clips> = React.memo(({ setView }) => {
  const { filteredClips, games, filter, updateFilter } = useClips();
  const { settings } = useSettings();

  const containerRef = useRef<HTMLDivElement>(null);
  const [rowsPerContainer, setRowsPerContainer] = useState(0);

  const {
    currentPage,
    totalPages,
    currentItems: currentClips,
    goToPage,
  } = usePagination(filteredClips, CLIPS_PER_PAGE);

  useEffect(() => {
    const calculateRows = () => {
      if (containerRef.current) {
        const containerHeight = containerRef.current.offsetHeight;

        const calculatedRows = Math.floor(containerHeight / CLIP_HEIGHT);
        setRowsPerContainer(calculatedRows);
      }
    };

    calculateRows();

    window.addEventListener('resize', calculateRows);

    return () => window.removeEventListener('resize', calculateRows);
  }, []);

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

  const onPageReset = () => {
    goToPage(1);
  };

  const PaginationControls = useMemo(() => {
    if (filteredClips.length <= rowsPerContainer * 4) return null;
    if (!rowsPerContainer) return null;

    const totalPageCount = Math.ceil(filteredClips.length / (rowsPerContainer * 4));
    const pageNumbers: (number | string)[] = [];

    console.log(totalPageCount)

    if (currentPage > 2) pageNumbers.push(1);
    if (currentPage > 3) pageNumbers.push("...");

    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
      if (i > 0 && i <= totalPageCount) pageNumbers.push(i);
    }

    if (currentPage < totalPageCount - 2) pageNumbers.push("...");
    if (currentPage < totalPageCount - 1) pageNumbers.push(totalPageCount);

    return (
      <div className={styles.pagination}>
        {pageNumbers.map((page, index) =>
          typeof page === "number" ? (
            <button
              key={index}
              onClick={() => goToPage(page)}
              disabled={currentPage === page}
              className={`${currentPage === page && styles.currentPage}`}
            >
              {page}
            </button>
          ) : (
            <button key={index} className={styles.ellipsis} disabled={true}>
              {page}
            </button>
          )
        )}
      </div>
    );
  }, [currentPage, filteredClips.length, rowsPerContainer, goToPage]);

  return (
    <div className={styles.container} ref={containerRef}>
      <ClipFilters
        games={games}
        filter={filter}
        onFilterChange={updateFilter}
        onPageReset={onPageReset}
      />

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
