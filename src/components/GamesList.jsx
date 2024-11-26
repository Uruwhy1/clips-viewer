import { useContext } from "react";
import GlobalContext from "../contexts/GlobalContext";
import GameGroup from "./GameGroup";

const GamesList = () => {
  const { allClips } = useContext(GlobalContext);

  // Group clips by game, then by date within each game
  const clipsByGame = allClips.reduce((acc, clip) => {
    if (!acc[clip.game]) {
      acc[clip.game] = {};
    }
    if (!acc[clip.game][clip.formattedDate]) {
      acc[clip.game][clip.formattedDate] = [];
    }
    acc[clip.game][clip.formattedDate].push(clip);
    return acc;
  }, {});

  return (
    <div id="clips-list">
      <div className="clips-container">
        {Object.keys(clipsByGame).map((game) => (
          <GameGroup key={game} game={game} clipsByDate={clipsByGame[game]} />
        ))}
      </div>
    </div>
  );
};

export default GamesList;
