import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { useContext, useState, useRef, useEffect } from "react";
import GlobalContext from "../contexts/GlobalContext";
import { formatTime } from "../helpers/formatTime";
import createClipHandler from "../helpers/createClip";

const CurrentVideo = () => {
  const { currentClip, toggleFavourite, addClip } = useContext(GlobalContext);
  const [editing, setEditing] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef(null);

  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    setEditing(false);
    setStartTime(null);
    setEndTime(null);
    setNewName("");
  }, [currentClip]);

  useEffect(() => {
    console.log(startTime, endTime);
  }, [endTime, startTime]);

  if (currentClip == null) {
    return <div>Loading...</div>;
  }

  const handleFavouriteClick = (path) => toggleFavourite(path);

  const handlePathClick = (path) => invoke("open_file_explorer", { path });

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (event) => {
    if (videoRef.current) {
      const newTime =
        (event.nativeEvent.offsetX / event.target.offsetWidth) * duration;
      videoRef.current.currentTime = newTime;
    }
  };
  const markStart = () => setStartTime(videoRef.current.currentTime);
  const markEnd = () => setEndTime(videoRef.current.currentTime);

  return (
    <>
      <video
        ref={videoRef}
        id="video"
        controls
        src={convertFileSrc(currentClip.filePath)}
        onTimeUpdate={handleTimeUpdate}
      ></video>

      {editing ? (
        <>
          <div className="custom-video-bar" onClick={handleSeek}>
            <div
              className="progress"
              style={{
                width: `${(currentTime / duration) * 100}%`,
              }}
            ></div>
            {startTime && (
              <div
                className="start"
                style={{
                  left: `${(startTime / duration) * 100}%`,
                }}
              ></div>
            )}
            {endTime && (
              <div
                className="end"
                style={{
                  left: `${(endTime / duration) * 100}%`,
                }}
              ></div>
            )}
          </div>
          <div className="clip-controls">
            <button onClick={markStart}>Start</button>
            <button onClick={markEnd}>End</button>
            <input
              type="text"
              placeholder="New clip name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button
              onClick={() =>
                createClipHandler(
                  newName,
                  startTime,
                  endTime,
                  currentClip,
                  addClip
                )
              }
            >
              Create Clip
            </button>
          </div>
        </>
      ) : (
        <div className="info">
          <div className="clip-title-container">
            <p id="clip-title">{currentClip.name}</p>
            <p
              id="clip-favourite"
              className={currentClip.isFavourite ? "active" : ""}
              onClick={() => handleFavouriteClick(currentClip.filePath)}
            >
              ★
            </p>
          </div>
          <p id="clip-game">{currentClip.game}</p>
          <p id="clip-date">{currentClip.formattedDate}</p>
          <p
            id="clip-filename"
            onClick={() => handlePathClick(currentClip.filePath)}
          >
            {currentClip.filePath}
          </p>
        </div>
      )}

      <button onClick={() => setEditing(!editing)}>
        {editing ? "Exit Editing" : "Enter Editing"}
      </button>
    </>
  );
};

export default CurrentVideo;
