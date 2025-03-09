import React, { useContext, useRef, useState } from "react";
import GlobalContext from "../contexts/GlobalContext";
import styles from "./ClipItem.module.css";
import { Calendar, Tv } from "lucide-react";
import FavouriteButton from "./icons/StarButton.jsx";
import { convertFileSrc } from "@tauri-apps/api/core";

const MemoizedTv = React.memo(({ ...props }) => <Tv {...props} />);
const MemoizedCalendar = React.memo(({ ...props }) => <Calendar {...props} />);

const ClipItem = React.memo(({ clip, setView }) => {
  const { setCurrentClip, toggleFavourite } = useContext(GlobalContext);
  const [preloaded, setPreloaded] = useState(false);

  const handleClick = () => {
    setCurrentClip(clip);
    setView("video");
  };

  const handleFavouriteClick = (path) => {
    toggleFavourite(path);
  };

  const handleMouseEnter = () => {
    setPreloaded(true);
  };

  return (
    <div
      className={styles.clipCard}
      onClick={(e) => handleClick(clip)}
      onMouseEnter={handleMouseEnter}
    >
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

      <video
        src={preloaded ? clip.filePath : ""}
        preload="auto"
        style={{ display: "none" }}
      />
    </div>
  );
});

export default ClipItem;
