import React from "react";
import { Tv } from "lucide-react";
import styles from "./Clips.module.css";

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
    <div>
      <button onClick={onFilterClick}>
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
