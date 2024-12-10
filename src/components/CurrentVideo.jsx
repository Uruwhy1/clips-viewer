import { useContext, useState, useRef, useEffect } from "react";
import { Star, Calendar, Folder, Tv } from "lucide-react"; // Import necessary icons
import GlobalContext from "../contexts/GlobalContext";
import VideoComponent from "./Video";
import EditingControls from "./EditingControls";
import styles from "./CurrentVideo.module.css";
import { invoke } from "@tauri-apps/api/core";

const CurrentVideo = () => {
  const { currentClip, toggleFavourite } = useContext(GlobalContext);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [editing, setEditing] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (currentClip) {
      document.documentElement.style.setProperty(
        "--current-game-cover",
        `url("/${currentClip.game}.jpg")`
      );
    }
  }, [currentClip]);

  if (currentClip == null) {
    return <div>Loading...</div>;
  }

  const handleFavouriteClick = (path) => toggleFavourite(path);

  const handlePathClick = (path) => invoke("open_file_explorer", { path });

  const handleTimeUpdate = (currentTime, duration) => {
    setCurrentTime(currentTime);
    setDuration(duration);
  };

  return (
    <main className={styles.container}>
      <VideoComponent
        currentClip={currentClip}
        onTimeUpdate={handleTimeUpdate}
        ref={videoRef}
      />
      <div className={styles.info}>
        <div className={styles.infoContainer}>
          <div className={`${styles.clipTitleContainer} ${styles.infoItem}`}>
            <h2 className={styles.title}>{currentClip.name}</h2>
            {currentClip.isFavourite ? (
              <Star
                className={`${styles.favouriteButton} ${styles.active}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleFavouriteClick(currentClip.filePath);
                }}
              />
            ) : (
              <Star
                className={styles.favouriteButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleFavouriteClick(currentClip.filePath);
                }}
              />
            )}
          </div>
          <div className={styles.infoItem}>
            <Tv size={15} />
            <p className={styles.game}>{currentClip.game}</p>
          </div>
          <div className={styles.infoItem}>
            <Calendar size={15} />
            <p className={styles.date}>{currentClip.formattedDate}</p>
          </div>
          <div className={`${styles.infoItem} ${styles.filePath}`}>
            <Folder size={15} />
            <p
              className={styles.path}
              onClick={() => handlePathClick(currentClip.filePath)}
            >
              {currentClip.filePath}
            </p>
          </div>
        </div>
        <div className={styles.imageDiv}>
          <img src={`/${currentClip.game}.jpg`} alt="" />
        </div>
      </div>

      {!editing && (
        <div className={styles.editingButton}>
          <button
            onClick={() => {
              setEditing(true);
            }}
          >
            EDITING MODE
          </button>
        </div>
      )}
      {editing && (
        <EditingControls
          duration={duration}
          currentTime={currentTime}
          videoRef={videoRef}
        />
      )}
    </main>
  );
};

export default CurrentVideo;
