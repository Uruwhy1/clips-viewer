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
  Videotape,
} from "lucide-react";
import styles from "./Video.module.css";

const Video = forwardRef(({ currentClip, onTimeUpdate }, ref) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playback, setPlayback] = useState(null);
  const divRef = useRef();

  useEffect(() => {
    document.documentElement.style.setProperty("--value", 0);
  }, []);

  useEffect(() => {
    const handleKeystroke = (e) => {
      switch (e.key) {
        case "Escape":
          if (isFullscreen) {
            e.stopPropagation();
            toggleFullscreen();
          }
          break;
        case "ArrowLeft":
          ref.current.currentTime = ref.current.currentTime - 5;
          setCurrentTime(ref.current.currentTime);
          break;
        case "ArrowRight":
          ref.current.currentTime = ref.current.currentTime + 5;
          setCurrentTime(ref.current.currentTime);
          break;
        case " ":
          togglePlayPause();
          break;
      }
    };

    document.addEventListener("keydown", handleKeystroke);
    return () => {
      document.removeEventListener("keydown", handleKeystroke);
    };
  }, [isFullscreen, isPlaying]);

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
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (ref.current) {
      ref.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }

    if (ref.current.muted) handleVolumeChange(false);
    else {
      handleVolumeChange(volume);
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
      setCurrentTime(ref.current.currentTime);
      setDuration(ref.current.duration);
      onTimeUpdate(ref.current.currentTime, ref.current.duration);
    }
  };

  const handleSeek = (event) => {
    if (ref.current) {
      const newTime =
        (event.nativeEvent.offsetX / event.target.offsetWidth) * duration;
      ref.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const changePlaybackRate = (rate) => {
    if (ref.current) {
      ref.current.playbackRate = rate;
      setPlayback(rate);
    }
  };

  const handleVolumeChange = (e) => {
    let value = 0;
    let max = 1;

    if (typeof e == "number") {
      value = e;
    } else if (e) {
      const newVolume = parseFloat(e.target.value);
      setVolume(newVolume);
      if (newVolume === 0) {
        setIsMuted(true);
      } else {
        setIsMuted(false);
      }
      value = e.target.value;
      max = e.target.max || 1;
    }

    ref.current.volume = value;
    const percentage = value / max;

    document.documentElement.style.setProperty("--value", percentage);
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

        <div className={styles.progressBarContainer} onClick={handleSeek}>
          <div
            className={styles.progress}
            style={{ width: `${(currentTime / duration) * 100}%` }}
          ></div>
        </div>

        <div className={styles.volumeControl}>
          <button onClick={toggleMute} className={styles.controlButton}>
            {isMuted || volume === 0 ? (
              <VolumeX size={20} />
            ) : (
              <Volume2 size={20} />
            )}
          </button>
          <div className={styles.volumeSlider}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
            />
          </div>
        </div>

        <button onClick={toggleFullscreen} className={styles.controlButton}>
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
        <button
          className={`${styles.controlButton} ${styles.playbackContainer}`}
        >
          <Videotape />
          {/* prettier-ignore */}
          <div className={`${styles.playbackOptions} ${playback !== 1 ? styles.playbackActive : "" }`}>
            <div className={styles.playback} onClick={() => changePlaybackRate(2)}>2x</div>
            <div className={styles.playback} onClick={() => changePlaybackRate(1.5)}>1.5x</div>
            <div className={styles.playback} onClick={() => changePlaybackRate(1)}>1x</div>
            <div className={styles.playback} onClick={() => changePlaybackRate(0.5)}>0.5x</div>
            <div className={styles.playback} onClick={() => changePlaybackRate(0.25)}>0.25x</div>
          </div>
        </button>
      </div>
    </div>
  );
});

export default Video;
