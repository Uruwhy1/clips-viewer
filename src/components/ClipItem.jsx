import { useContext } from "react";
import GlobalContext from "../contexts/GlobalContext";
import styles from "./ClipItem.module.css";
import { Calendar, Calendar1, Star, Tv } from "lucide-react";

const ClipItem = ({ clip }) => {
  const { setCurrentClip, toggleFavourite } = useContext(GlobalContext);

  const handleClick = () => {
    setCurrentClip(clip);
  };

  const handleFavouriteClick = (path) => {
    toggleFavourite(path);
  };

  return (
    <div className={styles.clipCard} onClick={(e) => handleClick(clip)}>
      <div className={styles.header}>
        <h3>{clip.name}</h3>
        <Star
          size={18}
          onClick={(e) => {
            e.stopPropagation();
            handleFavouriteClick(clip.filePath);
          }}
          className={`${styles.favouriteButton} ${
            clip.isFavourite ? styles.active : ""
          }`}
        />
      </div>
      <div className={styles.clipMeta}>
        <div>
          <Tv size={15} />
          <span>{clip.game}</span>
        </div>
        <div>
          <Calendar size={15} />
          <span> {clip.formattedDate}</span>
        </div>
      </div>
    </div>
  );
};

export default ClipItem;
