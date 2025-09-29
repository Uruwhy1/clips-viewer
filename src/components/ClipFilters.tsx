import React, { useState, useCallback, useEffect } from "react";
import { ArrowDownNarrowWide, ArrowUpNarrowWide } from "lucide-react";
import styles from "./ClipFilters.module.css";
import DatePicker from "./DatePicker";
import GameFilter from "./GameFilter";
import FavouriteButton from "./icons/StarButton";
import PageCover from "./PageCover";

type SortOrder = "newest" | "oldest";

interface DateFilter {
  startDate: string | null;
  endDate: string | null;
}

interface FilterState {
  game: string;
  showFavourites: boolean;
  sortOrder: SortOrder;
  dateFilter: DateFilter;
}

interface FiltersProps {
  games: string[];
  filter: FilterState;
  onFilterChange: (newFilter: Partial<FilterState>) => void;
  onPageReset?: () => void;
}

const ClipFilters: React.FC<FiltersProps> = ({
  games,
  filter,
  onFilterChange,
  onPageReset,
}) => {
  const [showGames, setShowGames] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (showGames) {
          handleGameFilterClick();
        }
        if (showDatePicker) {
          handleDateToggle();
        }
      }
    };

    window.addEventListener("keydown", handleEscapeKey);
    return () => {
      window.removeEventListener("keydown", handleEscapeKey);
    };
  }, [showGames, showDatePicker]);

  const handleGameFilterClick = useCallback(() => {
    setShowGames((prev) => !prev);
  }, []);

  const handleGameSelect = useCallback(
    (game: string) => {
      onFilterChange({
        game: game === filter.game ? "All" : game,
      });
      setShowGames(false);
    },
    [filter.game, onFilterChange],
  );

  const handleDateToggle = useCallback(() => {
    setShowDatePicker((prev) => !prev);
  }, []);

  const handleDateChange = useCallback(
    (field: "startDate" | "endDate", value: string) => {
      onFilterChange({
        dateFilter: {
          ...filter.dateFilter,
          [field]: value || null,
        },
      });
      onPageReset?.();
    },
    [filter.dateFilter, onFilterChange, onPageReset],
  );

  const handleDateClear = useCallback(() => {
    onFilterChange({
      dateFilter: {
        startDate: null,
        endDate: null,
      },
    });
    onPageReset?.();
  }, [onFilterChange, onPageReset]);

  const handleSortToggle = useCallback(() => {
    onFilterChange({
      sortOrder: filter.sortOrder === "newest" ? "oldest" : "newest",
    });
    onPageReset?.();
  }, [filter.sortOrder, onFilterChange, onPageReset]);

  const handleFavouritesToggle = useCallback(() => {
    onFilterChange({
      showFavourites: !filter.showFavourites,
    });
  }, [filter.showFavourites, onFilterChange]);

  const handleOverlayClick = useCallback(() => {
    setShowGames(false);
    setShowDatePicker(false);
  }, []);

  const hasActiveDropdown = showGames || showDatePicker;

  return (
    <>
      {hasActiveDropdown && (
        <PageCover onClick={handleOverlayClick}></PageCover>
      )}

      <div className={styles.filters}>
        <GameFilter
          showGames={showGames}
          currentGame={filter.game}
          games={games}
          onFilterClick={handleGameFilterClick}
          onGameClick={handleGameSelect}
        />

        <div className={styles.secondaryFilters}>
          <DatePicker
            dateFilter={filter.dateFilter}
            isOpen={showDatePicker}
            onToggle={handleDateToggle}
            onDateChange={handleDateChange}
            onClear={handleDateClear}
          />

          <button
            className={styles.filterButton}
            onClick={handleSortToggle}
            title={`Sort by ${filter.sortOrder === "newest" ? "oldest" : "newest"} first`}
          >
            {filter.sortOrder === "newest" ? <ArrowUpNarrowWide size={18} /> : <ArrowDownNarrowWide size={18} />}
            <span>{filter.sortOrder === "newest" ? "Newest" : "Oldest"}</span>
          </button>

          <button
            className={`${styles.filterButton} ${styles.favouriteButton} ${filter.showFavourites ? styles.active : ""
              }`}
            onClick={handleFavouritesToggle}
            title="Show favourites only"
          >
            <FavouriteButton active={filter.showFavourites} size={18} />
            <span>Favourites</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default ClipFilters;
