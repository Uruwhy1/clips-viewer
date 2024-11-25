import { useState } from "react";
import DateGroup from "./DateGroup";

const GameGroup = ({ game, clipsByDate }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <div className="game-section">
      <div
        className={`game-section-title ${isCollapsed ? "collapsed" : ""}`}
        onClick={toggleCollapse}
      >
        <p>{game}</p>
      </div>
      {!isCollapsed && (
        <div className="game-dates">
          {Object.keys(clipsByDate)
            .sort((a, b) => new Date(b) - new Date(a)) // Sort dates descending
            .map((date) => (
              <DateGroup key={date} date={date} clips={clipsByDate[date]} />
            ))}
        </div>
      )}
    </div>
  );
};

export default GameGroup;
