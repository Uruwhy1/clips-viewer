import { useContext, useEffect, useState } from "react";
import CustomVideoBar from "./CustomVideoBar";
import styles from "./EditingControls.module.css";
import GlobalContext from "../contexts/GlobalContext";
import createClipHandler from "../helpers/createClip";

const EditingControls = ({ duration, currentTime, videoRef }) => {
  const { currentClip, addClip } = useContext(GlobalContext);

  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [newName, setNewName] = useState("");

  const markStart = () => {
    if (videoRef.current.currentTime !== 0) {
      setStartTime(videoRef.current.currentTime);
    } else {
      setStartTime(1);
    }
  };

  const markEnd = () => setEndTime(videoRef.current.currentTime);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  };

  useEffect(() => {
    setStartTime(null);
    setEndTime(null);
    setNewName("");
  }, [currentClip]);

  return (
    <div className={styles.editing}>
      <CustomVideoBar
        duration={duration}
        currentTime={currentTime}
        startTime={startTime}
        endTime={endTime}
        formatTime={formatTime}
        videoRef={videoRef}
      />
      <div className={styles.clipControls}>
        <button onClick={markStart}>Start</button>
        <button onClick={markEnd}>End</button>
        <input
          pattern="[A-Za-z0-9]"
          type="text"
          placeholder="New clip name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button
          onClick={() =>
            createClipHandler(newName, startTime, endTime, currentClip, addClip)
          }
        >
          Create Clip
        </button>
      </div>
    </div>
  );
};

export default EditingControls;
