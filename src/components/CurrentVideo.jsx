import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { useContext, useState, useRef, useEffect } from "react";
import GlobalContext from "../contexts/GlobalContext";
import createClipHandler from "../helpers/createClip";
import styles from "./CurrentVideo.module.css";

const CurrentVideo = () => {
  const { currentClip, toggleFavourite, addClip } = useContext(GlobalContext);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef(null);

  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [newName, setNewName] = useState("");
  const [timeIntervals, setTimeIntervals] = useState([]);

  const generateTimeIntervals = (videoDuration) => {
    const intervalOptions = [1, 5, 10, 30, 60, 300, 600];
    const styles = ["markerMini", "markerSmall", "markerMedium", "markerBig"];

    const selectedIntervals = intervalOptions.filter(
      (interval) =>
        interval * 2 < videoDuration && interval * 200 > videoDuration
    );

    const markers = [];
    let count = Math.max(0, 3 - selectedIntervals.length);

    selectedIntervals.slice(-4).forEach((interval) => {
      for (let time = interval; time < videoDuration; time += interval) {
        markers.push({
          time,
          percentage: (time / videoDuration) * 100,
          style: styles[count],
        });
      }
      count++;
    });

    return markers;
  };

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

    if (currentClip) {
      document.documentElement.style.setProperty(
        "--current-game-cover",
        `url("/${currentClip.game}.jpg")`
      );
    }
  }, [currentClip]);

  useEffect(() => {
    if (duration > 0) {
      setTimeIntervals(generateTimeIntervals(duration));
    }
  }, [currentClip, duration]);

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
  const markStart = () => {
    if (videoRef.current.currentTime !== 0) {
      setStartTime(videoRef.current.currentTime);
    } else {
      setStartTime(1);
    }
  };
  const markEnd = () => setEndTime(videoRef.current.currentTime);

  return (
    <main className={styles.container}>
      <div className={styles.videoContainer}>
        <video
          ref={videoRef}
          id="video"
          controls
          muted
          src={convertFileSrc(currentClip.filePath)}
          onTimeUpdate={handleTimeUpdate}
          className={styles.video}
          // play and pause immediately so duration gets set up
          autoPlay
          onLoadedData={() => {
            if (videoRef.current) {
              setTimeout(() => {
                videoRef.current.pause();
                videoRef.current.muted = false;
              }, 50);
            }
          }}
        ></video>
      </div>
      <div className={styles.info}>
        <div className={styles.infoContainer}>
          <div className={`${styles.clipTitleContainer} ${styles.infoItem}`}>
            <h2 className={styles.title}>{currentClip.name}</h2>
            <svg
              onClick={(e) => {
                e.stopPropagation();
                handleFavouriteClick(currentClip.filePath);
              }}
              className={`${styles.favouriteButton} ${
                currentClip.isFavourite ? styles.active : ""
              }`}
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
          <div className={styles.infoItem}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
              <polyline points="17 2 12 7 7 2"></polyline>
            </svg>
            <p className={styles.game}>{currentClip.game}</p>
          </div>
          <div className={styles.infoItem}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <p className={styles.date}>{currentClip.formattedDate}</p>
          </div>
          <div className={`${styles.infoItem} ${styles.filePath}`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            <p
              className={styles.path}
              onClick={() => handlePathClick(currentClip.filePath)}
            >
              {currentClip.filePath}
            </p>
          </div>
        </div>
        <div className={styles.imageDiv}>
          <img src={`/${currentClip.game}.jpg`} alt="" />
        </div>
      </div>
      <div className={styles.editing}>
        <div className={styles.customVideoBar} onClick={handleSeek}>
          <div
            className={styles.progress}
            style={{ width: `${(currentTime / duration) * 100}%` }}
          ></div>{" "}
          {timeIntervals.map((marker, index) => (
            <div
              key={index}
              className={`${styles.marker} ${styles[marker.style]}`}
              style={{ left: `${marker.percentage}%` }}
              title={`${marker.label} marker`}
            />
          ))}
          {startTime && (
            <div
              className={styles.start}
              style={{ left: `${(startTime / duration) * 100}%` }}
            ></div>
          )}
          {startTime && endTime && (
            <div
              className={styles.clipMarker}
              style={{
                left: `${(startTime / duration) * 100}%`,
                width: `calc(${(endTime / duration) * 100}% - ${
                  (startTime / duration) * 100
                }%)`,
              }}
            ></div>
          )}
          {endTime && (
            <div
              className={styles.end}
              style={{ left: `${(endTime / duration) * 100}%` }}
            ></div>
          )}{" "}
          <div className={styles.durationLabels}>
            <span className={styles.timeLabel}>00:00</span>
            <span className={styles.timeLabel}>{formatTime(duration / 2)}</span>
            <span className={styles.timeLabel}>{formatTime(duration)}</span>
          </div>
        </div>
        <div className={styles.clipControls}>
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
      </div>
    </main>
  );
};

export default CurrentVideo;
