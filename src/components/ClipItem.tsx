import React from "react";
import styles from "./ClipItem.module.css";
import type { LucideProps } from "lucide-react";
import { Calendar, Tv } from "lucide-react";
import FavouriteButton from "./icons/StarButton";

import { useClips } from "../contexts/ClipsContext";
import { Clip } from "../types/clip";

type ClipItemProps = {
  clip: Clip;
  setView: (view: string) => void;
};

const MemoizedTv = React.memo((props: LucideProps) => <Tv {...props} />);

const MemoizedCalendar = React.memo((props: LucideProps) => (
  <Calendar {...props} />
));
const ClipItem: React.FC<ClipItemProps> = React.memo(({ clip, setView }) => {
  const { setCurrentClip, toggleFavourite, isFavorite } = useClips();

  const handleClick = () => {
    setCurrentClip(clip);
    setView("video");
  };

  const handleFavouriteClick = (path: string) => {
    toggleFavourite(path);
  };

  return (
    <div className={styles.clipCard} onClick={(e) => handleClick()}>
      <div className={styles.header}>
        <h3>{clip.name}</h3>
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleFavouriteClick(clip.filePath);
          }}
        >
          <FavouriteButton size={18} active={isFavorite(clip.filePath)} />
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
