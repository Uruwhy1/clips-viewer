import React, { useEffect, useState } from "react";
import styles from "./EditingControls.module.css";
import createClipHandler from "../helpers/createClip";
import { usePopup } from "../contexts/PopupContext";
import { useClips } from "../contexts/ClipsContext";
import { Plus, FlagTriangleRight, FlagTriangleLeft } from "lucide-react";
import { listen } from "@tauri-apps/api/event";

const MemoizedPlus = React.memo(() => <Plus size={20} />);
// prettier-ignore
const MemoizedFlagTriangleRight = React.memo(() => <FlagTriangleRight size={20} />);
// prettier-ignore
const MemoizedFlagTriangleLeft = React.memo(() => <FlagTriangleLeft size={20} />);

const EditingControls = React.memo(({ videoRef, onMarkersUpdate }) => {
  const { currentClip, addClip } = useClips();
  const {
    showPopup,
    showPersistentNotification,
    removePersistentNotification,
  } = usePopup();

  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);

  useEffect(() => {
    let unlisten;

    async function setupListener() {
      unlisten = await listen("clip-progress", (event) => {
        const payload = event.payload;
        const { main_text, progress_text, progress, is_complete } = payload;

        const popupId = "clip-process";

        console.log(payload);
        showPersistentNotification(popupId, {
          mainText: main_text,
          progressText: [progress_text],
          progress: progress,
          isComplete: is_complete,
        });
      });
    }

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, [showPersistentNotification]);

  const markStart = () => {
    if (videoRef.current.currentTime !== 0) {
      setStartTime(videoRef.current.currentTime);
    } else {
      setStartTime(1);
    }
  };

  const markEnd = () => setEndTime(videoRef.current.currentTime);

  useEffect(() => {
    setStartTime(null);
    setEndTime(null);
  }, [currentClip]);

  useEffect(() => {
    if (onMarkersUpdate) {
      onMarkersUpdate(startTime, endTime);
    }
  }, [startTime, endTime, onMarkersUpdate]);

  return (
    <div className={styles.clipControls}>
      <button onClick={markStart} title="Mark Start">
        <MemoizedFlagTriangleLeft />
      </button>
      <button onClick={markEnd} title="Mark End">
        <MemoizedFlagTriangleRight />
      </button>

      <button
        onClick={async () => {
          let create = await createClipHandler(
            startTime,
            endTime,
            currentClip,
            addClip,
            showPersistentNotification,
            removePersistentNotification
          );

          if (create.response) {
            setStartTime(null);
            setEndTime(null);
          } else {
            showPopup(create.error, false);
          }
        }}
        title="Create Clip"
      >
        <MemoizedPlus />
      </button>
    </div>
  );
});

export default EditingControls;
