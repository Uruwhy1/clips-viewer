import { useContext } from "react";
import GlobalContext from "../contexts/GlobalContext";

const ClipItem = ({ clip }) => {
  const { setCurrentClip, toggleFavourite } = useContext(GlobalContext);

  const handleClick = () => {
    setCurrentClip(clip);
  };

  const handleFavouriteClick = (path) => {
    toggleFavourite(path);
  };

  return (
    <div
      onClick={() => {
        handleClick(clip);
      }}
      className={`clip-item ${clip.isFavourite ? "favourite" : ""}`}
    >
      <span>{clip.name}</span>
      <span
        className="favourite-icon"
        onClick={(e) => {
          e.stopPropagation();
          handleFavouriteClick(clip.filePath);
        }}
      >
        ★
      </span>
    </div>
  );
};

export default ClipItem;
