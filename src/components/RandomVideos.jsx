import React, {
  useContext,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Play } from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";
import GlobalContext from "../contexts/GlobalContext";
import styles from "./RandomVideos.module.css";

const RandomVideos = () => {
  const { allClips, setCurrentClip, currentClip } = useContext(GlobalContext);

  const [thumbnails, setThumbnails] = useState({});
  const [processingVideos, setProcessingVideos] = useState(new Set());

  // this also caches/preloads the videos
  const generateThumbnail = async (videoPath) => {
    if (processingVideos.has(videoPath)) return;

    setProcessingVideos((prev) => new Set(prev).add(videoPath));

    try {
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.src = convertFileSrc(videoPath);

      new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          // 20% or 5 seconds
          const seekTime = Math.min(video.duration * 0.2, 5);
          video.currentTime = seekTime;

          video.onseeked = () => {
            try {
              const canvas = document.createElement("canvas");
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;

              const ctx = canvas.getContext("2d");
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

              const dataUrl = canvas.toDataURL("image/jpeg", 0.35);
              setThumbnails((prev) => ({ ...prev, [videoPath]: dataUrl }));

              resolve();
            } catch (e) {
              reject(e);
            }
          };

          video.onerror = reject;
        };

        video.onerror = reject;
        video.load();
      });
    } catch (error) {
      console.error("Failed to generate thumbnail for:", videoPath, error);
    } finally {
      setProcessingVideos((prev) => {
        const newSet = new Set(prev);
        newSet.delete(videoPath);
        return newSet;
      });
    }
  };

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
  }, [currentClip.filePath]);

  useEffect(() => {
    if (randomClips.length === 0) return;

    setTimeout(() => {
      randomClips.forEach((clip) => {
        if (!thumbnails[clip.filePath]) {
          generateThumbnail(clip.filePath);
        }
      });
    }, 1000);
  }, [randomClips]);

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
