import { useContext } from "react";
import GlobalContext from "../contexts/GlobalContext";
import ClipItem from "./ClipItem";

const FavouriteClips = () => {
  const { allClips } = useContext(GlobalContext);

  const favouriteClips = allClips
    .filter((clip) => clip.isFavourite)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div id="clips-list">
      <div className="clips-container">
        {favouriteClips.map((clip) => (
          <ClipItem key={clip.filePath} clip={clip} />
        ))}
      </div>
    </div>
  );
};

export default FavouriteClips;
