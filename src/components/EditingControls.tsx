import React, { RefObject, useEffect, useState } from "react";
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

type EditingControlsProps = {
  videoRef: RefObject<HTMLVideoElement>;
  onMarkersUpdate: (start: number | null, end: number | null) => void;
};

const EditingControls = React.memo<EditingControlsProps>(
  ({ videoRef, onMarkersUpdate }) => {
    const { currentClip, addClip } = useClips();
    const {
      showPopup,
      showPersistentNotification,
      removePersistentNotification,
    } = usePopup();

    const [startTime, setStartTime] = useState<number | null>(null);
    const [endTime, setEndTime] = useState<number | null>(null);

    const markStart = () => {
      const newStartTime =
        videoRef.current.currentTime !== 0 ? videoRef.current.currentTime : 1;

      setStartTime(newStartTime);
      onMarkersUpdate(newStartTime, endTime);
    };

    const markEnd = () => {
      const newEndTime = videoRef.current.currentTime;

      setEndTime(newEndTime);
      onMarkersUpdate(startTime, newEndTime);
    };

    useEffect(() => {
      setStartTime(null);
      setEndTime(null);

      onMarkersUpdate(null, null);
    }, [currentClip, onMarkersUpdate]);

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

            if (!create.error) {
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
  }
);

export default EditingControls;
