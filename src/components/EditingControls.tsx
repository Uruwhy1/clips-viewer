import React, { RefObject, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./EditingControls.module.css";
import createClipHandler from "../helpers/createClip";
import { usePopup } from "../contexts/PopupContext";
import { useClips } from "../contexts/ClipsContext";
import { Plus, FlagTriangleRight, FlagTriangleLeft } from "lucide-react";
import CreateClipPopup from "./CreateClipPopup";

const MemoizedPlus = React.memo(() => <Plus size={20} />);
const MemoizedFlagTriangleRight = React.memo(() => (
  <FlagTriangleRight size={20} />
));
const MemoizedFlagTriangleLeft = React.memo(() => (
  <FlagTriangleLeft size={20} />
));

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
    const [showCreateClipPopup, setShowCreateClipPopup] = useState(false);

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

    const handleCreateClipClick = () => {
      if (!startTime || !endTime) {
        showPopup("Missing start or end time.", false);
        return;
      }
      if (startTime >= endTime) {
        showPopup("Start time is after end time.", false);
        return;
      }
      setShowCreateClipPopup(true);
    };

    const handleCreateNew = async (name: string) => {
      const result = await createClipHandler(
        startTime,
        endTime,
        currentClip,
        name,
        addClip,
        showPersistentNotification,
        removePersistentNotification,
      );

      if (!result.error) {
        setStartTime(null);
        setEndTime(null);
        onMarkersUpdate(null, null);
      } else {
        showPopup(result.error, false);
      }
    };

    useEffect(() => {
      setStartTime(null);
      setEndTime(null);
      onMarkersUpdate(null, null);
    }, [currentClip, onMarkersUpdate]);

    return (
      <>
        <div className={styles.clipControls}>
          <button onClick={markStart} title="Mark Start">
            <MemoizedFlagTriangleLeft />
          </button>
          <button onClick={markEnd} title="Mark End">
            <MemoizedFlagTriangleRight />
          </button>
          <button onClick={handleCreateClipClick} title="Create Clip">
            <MemoizedPlus />
          </button>
        </div>

        {showCreateClipPopup &&
          createPortal(
            <CreateClipPopup
              isOpen={showCreateClipPopup}
              onClose={() => setShowCreateClipPopup(false)}
              onCreateNew={handleCreateNew}
              currentClip={currentClip}
              startTime={startTime}
              endTime={endTime}
            />,
            document.getElementById("root") || document.body,
          )}
      </>
    );
  },
);

export default EditingControls;
