import React, {
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { Calendar, Folder, Tv, Edit3Icon, Trash2 } from "lucide-react";
import RenameInput from "./RenameInput";
import GlobalContext from "../contexts/GlobalContext";
import VideoComponent from "./Video";
import RandomVideos from "./RandomVideos";
import styles from "./CurrentVideo.module.css";
import { invoke } from "@tauri-apps/api/core";
import StarButton from "./icons/StarButton";
import { usePopup } from "../contexts/PopupContext";

const MemoizedCalendar = React.memo(() => <Calendar size={15} />);
const MemoizedFolder = React.memo(() => <Folder size={15} />);

const MemoizedTv = React.memo(({ ...props }) => <Tv size={15} {...props} />);
// prettier-ignore
const MemoizedEdit3Icon = React.memo(({ ...props }) => (<Edit3Icon {...props} />));
const MemoizedTrash2 = React.memo(({ ...props }) => <Trash2 {...props} />);

const CurrentVideo = React.memo(() => {
  const {
    currentClip,
    deleteClip,
    toggleFavourite,
    coverCache,
    editClip,
    favourites,
  } = useContext(GlobalContext);
  const { showPopup } = usePopup();
  const [cover, setCover] = useState("");
  const [imageError, setImageError] = useState(false);
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

  const handleEditClick = useCallback(() => {
    setRenaming((prev) => !prev);
  }, []);

  const handleDeleteClick = useCallback(async () => {
    const confirmDelete = await window.confirm(
      "Are you sure you want to delete this clip?"
    );
    if (confirmDelete) {
      let response = await deleteClip(currentClip.filePath);
      if (response) {
        showPopup("Clip deleted!", true);
        if (currentClip.isFavourite()) {
          toggleFavourite();
        }
      } else {
        showPopup("Failed to delete clip.", false);
      }
    }
  }, [currentClip, deleteClip]);

  const renameClipFile = useCallback(
    async (clip, title) => {
      if (title !== clip.name) {
        let response = await editClip(clip, title);

        if (response) showPopup("Clip renamed!", true);
        else {
          showPopup("Failed to rename.", false);
        }
      }
      setRenaming(false);
    },
    [editClip]
  );

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <main className={styles.container}>
      <VideoComponent currentClip={currentClip} ref={videoRef} />
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
                  handleFavouriteClick(currentClip.filePath);
                }}
              >
                <StarButton active={currentClip.isFavourite} />
              </div>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick();
                }}
              >
                <MemoizedTrash2 className={styles.titleButton} />
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
        {!imageError && cover && (
          <div className={styles.imageDiv}>
            <img
              src={cover}
              alt={`${currentClip.game} Cover`}
              onError={handleImageError}
            />
          </div>
        )}
      </div>
      <RandomVideos />
    </main>
  );
});

export default CurrentVideo;
