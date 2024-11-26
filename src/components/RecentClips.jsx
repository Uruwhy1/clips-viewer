import { useContext } from "react";
import GlobalContext from "../contexts/GlobalContext";
import DateGroup from "./DateGroup";

const RecentClips = () => {
  const { allClips } = useContext(GlobalContext);

  const clipsByDate = allClips.reduce((acc, clip) => {
    if (!acc[clip.formattedDate]) {
      acc[clip.formattedDate] = [];
    }
    acc[clip.formattedDate].push(clip);
    return acc;
  }, {});

  return (
    <div id="clips-list">
      {Object.keys(clipsByDate)
        .sort((a, b) => new Date(b) - new Date(a)) // Sort dates descending
        .map((formattedDate) => (
          <DateGroup
            key={formattedDate}
            date={formattedDate}
            clips={clipsByDate[formattedDate]}
          />
        ))}
    </div>
  );
};

export default RecentClips;
