import { useContext } from "react";
import GlobalContext from "../contexts/GlobalContext";

const ClipItem = ({ clip }) => {
  const { setCurrentClip } = useContext(GlobalContext);

  const handleClick = () => {
    setCurrentClip(clip);
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
          toggleFavorite();
        }}
      >
        ★
      </span>
    </div>
  );
};

export default ClipItem;
