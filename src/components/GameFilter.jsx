import React from "react";
import { Tv } from "lucide-react";
import styles from "./Clips.module.css";

const GameFilter = ({
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
