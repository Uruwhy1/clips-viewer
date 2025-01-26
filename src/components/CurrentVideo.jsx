import React, {
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { Star, Calendar, Folder, Tv, Edit3Icon, Trash2 } from "lucide-react";
import RenameInput from "./RenameInput";
import GlobalContext from "../contexts/GlobalContext";
import VideoComponent from "./Video";
import EditingControls from "./EditingControls";
import styles from "./CurrentVideo.module.css";
import { invoke } from "@tauri-apps/api/core";

const MemoizedCalendar = React.memo(() => <Calendar size={15} />);
const MemoizedFolder = React.memo(() => <Folder size={15} />);

const MemoizedTv = React.memo(({ ...props }) => <Tv size={15} {...props} />);
// prettier-ignore
const MemoizedEdit3Icon = React.memo(({ ...props }) => (<Edit3Icon {...props} />));
const MemoizedStar = React.memo(({ ...props }) => <Star {...props} />);
const MemoizedTrash2 = React.memo(({ ...props }) => <Trash2 {...props} />);

const CurrentVideo = React.memo(() => {
  const { currentClip, deleteClip, toggleFavourite, coverCache, editClip } =
    useContext(GlobalContext);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [editing, setEditing] = useState(false);
  const [cover, setCover] = useState(null);
  const videoRef = useRef(null);
  const [renaming, setRenaming] = useState(false);

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

  const handleEditClick = useCallback(() => {
    setRenaming((prev) => !prev);
  }, []);

  const handleDeleteClick = useCallback(async () => {
    const confirmDelete = await window.confirm(
      "Are you sure you want to delete this clip?"
    );
    if (confirmDelete) {
      deleteClip(currentClip.filePath);
    }
  }, [currentClip, deleteClip]);

  const renameClipFile = useCallback(
    (clip, title) => {
      if (title !== clip.name) {
        editClip(clip, title);
      }
      setRenaming(false);
    },
    [editClip]
  );
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
              <RenameInput clip={currentClip} onRename={renameClipFile} />
            ) : (
              <h2 className={styles.title}>{currentClip.name}</h2>
            )}
            <div>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditClick();
                }}
              >
                <MemoizedEdit3Icon className={styles.titleButton} />
              </div>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick();
                }}
              >
                <MemoizedTrash2 className={styles.titleButton} />
              </div>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleFavouriteClick(currentClip.filePath);
                }}
              >
                <MemoizedStar
                  className={`${styles.titleButton} ${
                    currentClip.isFavourite && styles.active
                  }`}
                />
              </div>
            </div>
          </div>
          <div className={styles.infoItem}>
            <MemoizedTv />
            <p className={styles.game}>{currentClip.game}</p>
          </div>
          <div className={styles.infoItem}>
            <MemoizedCalendar />
            <p className={styles.date}>{currentClip.formattedDate}</p>
          </div>
          <div className={`${styles.infoItem} ${styles.filePath}`}>
            <MemoizedFolder />
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
          <button onClick={() => setEditing(true)}>EDITING MODE</button>
        </div>
      )}
      {editing && (
        <EditingControls
          setCurrentTime={setCurrentTime}
          duration={duration}
          currentTime={currentTime}
          videoRef={videoRef}
        />
      )}
    </main>
  );
});

export default CurrentVideo;
