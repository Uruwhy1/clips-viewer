import { useState } from "react";
import ClipItem from "./ClipItem";

const DateGroup = ({ date, clips }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <div className="date-section">
      <div
        className={`date-section-title ${isCollapsed ? "collapsed" : ""}`}
        onClick={toggleCollapse}
      >
        <span>{date}</span>
      </div>
      {!isCollapsed && (
        <div className="clips-container">
          {clips.map((clip) => (
            <ClipItem key={clip.name} clip={clip} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DateGroup;
