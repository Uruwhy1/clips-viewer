import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { useContext, useState, useRef } from "react";
import GlobalContext from "../contexts/GlobalContext";
import { formatTime } from "../helpers/formatTime";

const CurrentVideo = () => {
  const { currentClip, toggleFavourite } = useContext(GlobalContext);
  const [editing, setEditing] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef(null);

  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);

  if (currentClip == null) {
    return <div>Loading...</div>;
  }

  const handleFavouriteClick = (path) => {
    toggleFavourite(path);
  };

  const handlePathClick = (path) => {
    invoke("open_file_explorer", { path: path });
  };

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

  const markStart = () => {
    setStartTime(videoRef.current.currentTime);
  };

  const markEnd = () => {
    setEndTime(videoRef.current.currentTime);
  };

  const createClipHandler = async () => {
    if (startTime >= endTime) {
      alert("The start is after the end! D:");
      return;
    }

    if (startTime !== null && endTime !== null && currentClip) {
      const startFormatted = formatTime(startTime);
      const endFormatted = formatTime(endTime);

      const outputFilePath =
        currentClip.filePath.replace(/\.[^/.]+$/, "") + "_clip.mp4";
      try {
        const response = await invoke("create_clip", {
          inputFile: currentClip.filePath,
          startTime: startFormatted,
          endTime: endFormatted,
          outputFile: outputFilePath,
        });
        alert(response);
      } catch (error) {
        alert(`Error creating clip: ${error}`);
      }
    } else {
      alert("Please mark both start and end times first.");
    }
  };

  return (
    <>
      <video
        ref={videoRef}
        id="video"
        controls
        src={convertFileSrc(currentClip.filePath)}
        onTimeUpdate={handleTimeUpdate}
      ></video>

      {editing && (
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
            <button onClick={createClipHandler}>Create Clip</button>
          </div>
        </>
      )}

      {!editing && (
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
            onClick={() => {
              handlePathClick(currentClip.filePath);
            }}
          >
            {currentClip.filePath}
          </p>
        </div>
      )}
    </>
  );
};

export default CurrentVideo;
