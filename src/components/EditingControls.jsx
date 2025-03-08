import React, { useContext, useEffect, useState } from "react";
import styles from "./EditingControls.module.css";
import GlobalContext from "../contexts/GlobalContext";
import createClipHandler from "../helpers/createClip";
import { usePopup } from "../contexts/PopupContext";
import { Plus, Flag, FlagTriangleRight, FlagTriangleLeft } from "lucide-react";

const EditingControls = React.memo(
  ({ videoRef, onMarkersUpdate, duration }) => {
    const { currentClip, addClip } = useContext(GlobalContext);
    const { showPopup } = usePopup();

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

    useEffect(() => {
      setStartTime(null);
      setEndTime(null);
      setNewName("");
    }, [currentClip]);

    useEffect(() => {
      if (onMarkersUpdate) {
        onMarkersUpdate(startTime, endTime);
      }
    }, [startTime, endTime, onMarkersUpdate]);

    return (
      <div className={styles.clipControls}>
        <button onClick={markStart} title="Mark Start">
          <FlagTriangleLeft size={20} />
        </button>
        <button onClick={markEnd} title="Mark End">
          <FlagTriangleRight size={20} />
        </button>

        <button
          onClick={async () => {
            let create = await createClipHandler(
              newName,
              startTime,
              endTime,
              currentClip,
              addClip
            );

            if (create.response) {
              setStartTime(null);
              setEndTime(null);
              setNewName("");

              showPopup("Created clip!", true);
            } else {
              showPopup(create.error, false);
            }
          }}
          title="Create Clip"
        >
          <Plus />
        </button>
      </div>
    );
  }
);

export default EditingControls;
