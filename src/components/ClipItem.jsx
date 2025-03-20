import React from "react";
import styles from "./ClipItem.module.css";
import { Calendar, Tv } from "lucide-react";
import FavouriteButton from "./icons/StarButton.jsx";

import { useClips } from "../contexts/ClipsContext";
import { useFavorites } from "../contexts/FavoritesContext";

const MemoizedTv = React.memo(({ ...props }) => <Tv {...props} />);
const MemoizedCalendar = React.memo(({ ...props }) => <Calendar {...props} />);

const ClipItem = React.memo(({ clip, setView }) => {
  const { setCurrentClip } = useClips();
  const { toggleFavourite } = useFavorites();

  const handleClick = () => {
    setCurrentClip(clip);
    setView("video");
  };

  const handleFavouriteClick = (path) => {
    toggleFavourite(path);
  };

  return (
    <div className={styles.clipCard} onClick={(e) => handleClick(clip)}>
      <div className={styles.header}>
        <h3>{clip.name}</h3>
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleFavouriteClick(clip.filePath);
          }}
        >
          <FavouriteButton size={18} active={clip.isFavourite} />
        </div>
      </div>
      <div className={styles.clipMeta}>
        <div>
          <MemoizedTv size={15} />
          <span>{clip.game}</span>
        </div>
        <div>
          <MemoizedCalendar size={15} />
          <span> {clip.formattedDate}</span>
        </div>
      </div>
    </div>
  );
});

export default ClipItem;
