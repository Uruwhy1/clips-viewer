import React, { useContext, useMemo, useCallback } from "react";
import { Play } from "lucide-react";
import GlobalContext from "../contexts/GlobalContext";
import styles from "./RandomVideos.module.css";

const RandomVideos = () => {
  const { allClips, setCurrentClip, currentClip } = useContext(GlobalContext);

  const randomClips = useMemo(() => {
    if (!allClips.length || !currentClip) return [];

    const availableClips = allClips.filter(
      (clip) => clip.filePath !== currentClip.filePath && clip.isFavourite
    );

    if (availableClips.length === 0) return [];

    const randomSelected = [];
    const maxClips = Math.min(6, availableClips.length);

    const clipsCopy = [...availableClips];

    for (let i = 0; i < maxClips; i++) {
      const randomIndex = Math.floor(Math.random() * clipsCopy.length);
      randomSelected.push(clipsCopy[randomIndex]);
      clipsCopy.splice(randomIndex, 1);
    }

    return randomSelected;
  }, [allClips, currentClip]);

  const handleClipClick = useCallback(
    (clip) => {
      setCurrentClip(clip);
    },
    [setCurrentClip]
  );

  if (randomClips.length === 0) {
    return <div className={styles.noClips}>No other clips available</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.clipsList}>
        {randomClips.map((clip) => (
          <div
            key={clip.filePath}
            className={styles.clipItem}
            onClick={() => handleClipClick(clip)}
          >
            <div className={styles.thumbnailContainer}>
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
