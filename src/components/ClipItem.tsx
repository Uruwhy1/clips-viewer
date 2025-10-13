import React, { startTransition, useState } from "react";
import styles from "./ClipItem.module.css";

import type { LucideProps } from "lucide-react";
import { Calendar, Tv, Clock } from "lucide-react";
import FavouriteButton from "./icons/StarButton";

import { useClips } from "../contexts/ClipsContext";
import { Clip } from "../types/clip";
import { convertFileSrc } from "@tauri-apps/api/core";
import { formatTime } from "../helpers/formatTime";

type ClipItemProps = {
  clip: Clip;
  setView: (view: string) => void;
};

const MemoizedTv = React.memo((props: LucideProps) => <Tv {...props} />);
const MemoizedCalendar = React.memo((props: LucideProps) => (
  <Calendar {...props} />
));
const MemoizedClock = React.memo((props: LucideProps) => <Clock {...props} />);

const ClipItem: React.FC<ClipItemProps> = React.memo(({ clip, setView }) => {
  const { setCurrentClip, toggleFavourite, isFavorite } = useClips();

  const [imgError, setImgError] = useState<boolean>(false);

  const handleClick = () => {
    setCurrentClip(clip);

    startTransition(() => {
      setView("video");
    });
  };
  const handleFavouriteClick = (path: string) => {
    toggleFavourite(path);
  };

  return (
    <div className={styles.clipCard} onClick={(e) => handleClick()}>
      {!imgError ? (
        <img
          className={styles.thumbnail}
          style={{ viewTransitionName: `clip-${clip.date}` }}
          src={convertFileSrc(clip.thumbnail)}
          onError={() => setImgError(true)}
          alt=""
        />
      ) : (
        <div className={styles.thumbnail}></div>
      )}

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
          <MemoizedClock size={15} />
          <span> {formatTime(clip.videoDuration)}</span>
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
