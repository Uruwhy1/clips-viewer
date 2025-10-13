import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Calendar,
  Folder,
  Tv,
  Edit3Icon,
  Trash2,
  LucideProps,
} from "lucide-react";
import RenameInput from "./RenameInput";
import VideoComponent from "./Video";
import RandomVideos from "./RandomVideos";
import styles from "./CurrentVideo.module.css";
import { invoke } from "@tauri-apps/api/core";
import StarButton from "./icons/StarButton";
import { usePopup } from "../contexts/PopupContext";
import { useClips } from "../contexts/ClipsContext";
import { useMedia } from "../contexts/MediaContext";
import { Clip } from "../types/clip";

const MemoizedCalendar = React.memo(() => <Calendar size={15} />);
const MemoizedFolder = React.memo(() => <Folder size={15} />);
const MemoizedTv = React.memo((props: LucideProps) => (
  <Tv size={15} {...props} />
));
const MemoizedEdit3Icon = React.memo((props: LucideProps) => (
  <Edit3Icon {...props} />
));
const MemoizedTrash2 = React.memo((props: LucideProps) => (
  <Trash2 {...props} />
));

const CurrentVideo: React.FC = React.memo(() => {
  const { currentClip, deleteClip, editClip, isFavorite, toggleFavourite } =
    useClips();
  const { coverCache } = useMedia();
  const { showPopup } = usePopup();

  const [imageError, setImageError] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [renaming, setRenaming] = useState<boolean>(false);

  if (currentClip == null) {
    return <div>There's no clip. This should not be possible.</div>;
  }

  const handleFavouriteClick = (path: string) => toggleFavourite(path);

  const handlePathClick = (path: string) =>
    invoke("open_file_explorer", { path });

  const handleEditClick = useCallback(() => {
    setRenaming((prev) => !prev);
  }, []);

  const handleDeleteClick = useCallback(async () => {
    const confirmDelete = await window.confirm(
      "Are you sure you want to delete this clip?",
    );

    if (confirmDelete) {
      let response = await deleteClip(
        currentClip.filePath,
        currentClip.isFavourite,
      );
      if (response) {
        showPopup("Clip deleted!", true);
      } else {
        showPopup("Failed to delete clip.", false);
      }
    }
  }, [currentClip, deleteClip]);

  const renameClipFile = useCallback(
    async (clip: Clip, title: string) => {
      if (title !== clip.name) {
        let response = await editClip(clip, title);

        if (response) showPopup("Clip renamed!", true);
        else {
          console.log(response);
          showPopup("Failed to rename.", false);
        }
      }
      setRenaming(false);
    },
    [editClip],
  );

  const handleImageError = (e: any) => {
    const target = e.currentTarget as HTMLImageElement;
    target.onerror = null; // prevent infinite loop
    target.src = coverCache.get("default") || "";
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
                <StarButton active={isFavorite(currentClip.filePath)} />
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
        <div className={styles.imageDiv}>
          <img
            src={coverCache.get(currentClip.game)}
            alt={`${currentClip.game} Cover`}
            onError={(e) => handleImageError(e)}
          />
        </div>
      </div>
      <RandomVideos />
    </main>
  );
});

export default CurrentVideo;
