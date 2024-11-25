import { useContext } from "react";
import GlobalContext from "../contexts/GlobalContext";
import DateGroup from "./DateGroup";

const RecentClips = () => {
  const { allClips } = useContext(GlobalContext);

  // Group clips by date
  const clipsByDate = allClips.reduce((acc, clip) => {
    if (!acc[clip.date]) {
      acc[clip.date] = [];
    }
    acc[clip.date].push(clip);
    return acc;
  }, {});

  return (
    <div id="clips-list">
      {Object.keys(clipsByDate)
        .sort((a, b) => new Date(b) - new Date(a)) // Sort dates descending
        .map((date) => (
          <DateGroup key={date} date={date} clips={clipsByDate[date]} />
        ))}
    </div>
  );
};

export default RecentClips;
