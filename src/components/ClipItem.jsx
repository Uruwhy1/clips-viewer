import { useContext } from "react";
import GlobalContext from "../contexts/GlobalContext";

const ClipItem = ({ clip }) => {
  const { setAllClips } = useContext(GlobalContext);

  const toggleFavorite = () => {
    setAllClips((prevClips) =>
      prevClips.map((c) =>
        c.name === clip.name && c.date === clip.date
          ? { ...c, isFavourite: !c.isFavourite }
          : c
      )
    );
  };

  return (
    <div className={`clip-item ${clip.isFavourite ? "favourite" : ""}`}>
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
