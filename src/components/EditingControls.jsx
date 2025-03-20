import React, { useEffect, useState } from "react";
import styles from "./EditingControls.module.css";
import createClipHandler from "../helpers/createClip";
import { usePopup } from "../contexts/PopupContext";
import { useClips } from "../contexts/ClipsContext";
import { Plus, FlagTriangleRight, FlagTriangleLeft } from "lucide-react";

const MemoizedPlus = React.memo(() => <Plus size={20} />);
// prettier-ignore
const MemoizedFlagTriangleRight = React.memo(() => <FlagTriangleRight size={20} />);
// prettier-ignore
const MemoizedFlagTriangleLeft = React.memo(() => <FlagTriangleLeft size={20} />);

const EditingControls = React.memo(({ videoRef, onMarkersUpdate }) => {
  const { currentClip, addClip } = useClips();
  const { showPopup } = usePopup();

  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);

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
            addClip
          );

          if (create.response) {
            setStartTime(null);
            setEndTime(null);

            showPopup("Created clip!", true);
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
