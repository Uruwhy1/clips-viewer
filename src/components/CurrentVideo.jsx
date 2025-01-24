import { useContext, useState, useRef, useEffect } from "react";
import { Star, Calendar, Folder, Tv, Edit3Icon, Save } from "lucide-react";
import GlobalContext from "../contexts/GlobalContext";
import VideoComponent from "./Video";
import EditingControls from "./EditingControls";
import styles from "./CurrentVideo.module.css";
import { invoke } from "@tauri-apps/api/core";

const CurrentVideo = () => {
  const { currentClip, toggleFavourite, coverCache, editClip } =
    useContext(GlobalContext);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [editing, setEditing] = useState(false);
  const [cover, setCover] = useState(null);
  const videoRef = useRef(null);

  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(currentClip.name);

  useEffect(() => {
    if (coverCache.has(currentClip.game)) {
      setCover(coverCache.get(currentClip.game));
    }
  }, [currentClip, coverCache]);

  if (currentClip == null) {
    return <div>There's no clip. This should not be possible.</div>;
  }

  const handleFavouriteClick = (path) => toggleFavourite(path);

  const handlePathClick = (path) => invoke("open_file_explorer", { path });

  const handleTimeUpdate = (currentTime, duration) => {
    setCurrentTime(currentTime);
    setDuration(duration);
  };

  const handleEditClick = () => {
    setRenaming(!renaming);
  };

  const renameClipFile = (clip, title) => {
    editClip(clip, title);
    setRenaming(false);
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
            {renaming ? (
              <div>
                <input
                  autoFocus
                  className={styles.titleRename}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <Save
                  className={styles.titleButton}
                  onClick={() => renameClipFile(currentClip, title)}
                />
              </div>
            ) : (
              <h2 className={styles.title}>{currentClip.name}</h2>
            )}
            <div>
              <Edit3Icon
                className={styles.titleButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditClick();
                }}
              />
              <Star
                className={`${styles.titleButton} ${
                  currentClip.isFavourite && styles.active
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleFavouriteClick(currentClip.filePath);
                }}
              />
            </div>
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
          <img src={cover} alt={`${currentClip.game} Cover`} />
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
