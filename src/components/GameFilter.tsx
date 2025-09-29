import React, { useEffect } from "react";
import { Tv } from "lucide-react";
import styles from "./ClipFilters.module.css";

type GameFilterProps = {
  showGames: boolean;
  currentGame: string;
  games: string[];
  onFilterClick: () => void;
  onGameClick: (game: string) => void;
};

const GameFilter: React.FC<GameFilterProps> = ({
  showGames,
  currentGame,
  games,
  onFilterClick,
  onGameClick,
}) => {
  return (
    <div
      className={styles.primaryFilter}
      style={{ zIndex: showGames ? 3 : "auto" }}
    >
      <button className={styles.filterButton} onClick={onFilterClick}>
        <Tv size={17} />
        <p>{currentGame}</p>
      </button>

      {showGames && (
        <div className={styles.gamesList}>
          {games.map((game) => (
            <button
              key={game}
              className={currentGame === game ? styles.active : ""}
              onClick={() => onGameClick(game)}
            >
              {game}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(GameFilter);
