import { useState, forwardRef, useRef, useEffect } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
} from "lucide-react";
import styles from "./Video.module.css";

const Video = forwardRef(({ currentClip, onTimeUpdate }, ref) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const divRef = useRef();

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isFullscreen) {
        e.stopPropagation();
        toggleFullscreen();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isFullscreen]);

  useEffect(() => {
    const handleDoubleClick = () => toggleFullscreen();
    const currentDiv = divRef.current;

    if (currentDiv) {
      currentDiv.addEventListener("dblclick", handleDoubleClick);
    }

    return () => {
      if (currentDiv) {
        currentDiv.removeEventListener("dblclick", handleDoubleClick);
      }
    };
  }, [isFullscreen]);

  const toggleFullscreen = async () => {
    const window = getCurrentWindow();
    if (!isFullscreen) {
      divRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    window.setFullscreen(!isFullscreen);
    setIsFullscreen(!isFullscreen);
  };

  const togglePlayPause = () => {
    if (ref.current) {
      if (isPlaying) {
        ref.current.pause();
      } else {
        ref.current.play();
      }
      console.log("Xd", isPlaying);
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (ref.current) {
      ref.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const handleTimeUpdate = () => {
    if (ref.current) {
      const progressFill = document.querySelector(`.${styles.progressBarFill}`);
      const progress = (ref.current.currentTime / ref.current.duration) * 100;
      setCurrentTime(ref.current.currentTime);
      setDuration(ref.current.duration);
      if (progressFill) {
        progressFill.style.width = `${progress}%`;
      }
      onTimeUpdate(ref.current.currentTime, ref.current.duration);
    }
  };

  return (
    <div className={styles.videoContainer} ref={divRef}>
      <video
        ref={ref}
        id="video"
        muted={isMuted}
        src={convertFileSrc(currentClip.filePath)}
        onTimeUpdate={handleTimeUpdate}
        className={styles.video}
        onClick={togglePlayPause}
        autoPlay
      ></video>
      <div className={styles.controls}>
        <button onClick={togglePlayPause} className={styles.controlButton}>
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>

        <span className={styles.time}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <div className={styles.progressBarContainer}>
          <div className={styles.progressBarFill}>
            <div className={styles.progressBarCircle}></div>
          </div>
          <input
            type="range"
            className={styles.progressBar}
            min="0"
            max={duration}
            value={currentTime}
            onChange={(e) => {
              if (ref.current) {
                ref.current.currentTime = e.target.value;
                setCurrentTime(e.target.value);
              }
            }}
          />
        </div>

        <button onClick={toggleMute} className={styles.controlButton}>
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        <button onClick={toggleFullscreen} className={styles.controlButton}>
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
      </div>
    </div>
  );
});

export default Video;
