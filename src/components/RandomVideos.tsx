import { useCallback, useEffect, useState } from "react";
import { Play } from "lucide-react";
import styles from "./RandomVideos.module.css";
import { useClips } from "../contexts/ClipsContext";
import { Clip } from "../types/clip";

const RandomVideos = () => {
  const { setCurrentClip, currentClip, randomClips } = useClips();

  const handleClipClick = useCallback(
    (clip: Clip) => {
      setCurrentClip(clip);
    },
    [setCurrentClip],
  );

  if (randomClips.length === 0) {
    return <div className={styles.noClips}>No other clips available</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.clipsList}>
        {randomClips.map((clip: Clip) => (
          <div
            key={clip.filePath}
            className={`${styles.clipItem} ${currentClip?.filePath === clip.filePath ? styles.active : ""
              }`}
            onClick={() => handleClipClick(clip)}
          >
            <div className={styles.thumbnailContainer}>
              <img src={clip.thumbnail || ""} alt=""></img>
              <div className={styles.playIcon}>
                <Play size={24} />
              </div>
            </div>
            <div className={styles.clipInfo}>
              <p className={styles.clipName}>{clip.name}</p>
              <p className={styles.clipGame}>{clip.game}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RandomVideos;
