import React, { useContext, useCallback } from "react";
import { Play } from "lucide-react";
import GlobalContext from "../contexts/GlobalContext";
import styles from "./RandomVideos.module.css";

const RandomVideos = () => {
  // Use the thumbnail data from GlobalContext
  const { randomClips, setCurrentClip, currentClip, thumbnails } = useContext(GlobalContext);

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
            className={`${styles.clipItem} ${
              currentClip.filePath == clip.filePath ? styles.active : ""
            }`}
            onClick={() => handleClipClick(clip)}
          >
            <div
              className={styles.thumbnailContainer}
              style={
                thumbnails[clip.filePath]
                  ? {
                      backgroundImage: `url(${thumbnails[clip.filePath]})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : {}
              }
            >
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