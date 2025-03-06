import React, { useState, forwardRef, useRef, useEffect } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings2,
} from "lucide-react";
import styles from "./Video.module.css";

const MemoizedPlay = React.memo(() => <Play size={20} />);
const MemoizedPause = React.memo(() => <Pause size={20} />);
const MemoizedVolumeX = React.memo(() => <VolumeX size={20} />);
const MemoizedVolume2 = React.memo(() => <Volume2 size={20} />);
const MemoizedMinimize = React.memo(() => <Minimize size={20} />);
const MemoizedMaximize = React.memo(() => <Maximize size={20} />);
const MemoizedVideotape = React.memo(() => <Settings2 size={20} />);

const Video = forwardRef(({ currentClip, onTimeUpdate }, ref) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playback, setPlayback] = useState(null);
  const divRef = useRef();
  const animationFrameRef = useRef();

  useEffect(() => {
    document.documentElement.style.setProperty("--volume", 0);
  }, []);

  useEffect(() => {
    const handleKeystroke = (e) => {
      if (document.activeElement === ref.current) {
        switch (e.key) {
          case "Escape":
            if (isFullscreen) {
              e.stopPropagation();
              toggleFullscreen();
            }
            break;
          case "ArrowLeft":
            ref.current.currentTime = Math.max(0, ref.current.currentTime - 5);
            setCurrentTime(ref.current.currentTime);
            break;
          case "ArrowRight":
            ref.current.currentTime = Math.min(
              ref.current.duration,
              ref.current.currentTime + 5
            );
            setCurrentTime(ref.current.currentTime);
            break;
          case " ":
            togglePlayPause();
            break;
        }
      }
    };

    ref.current.tabIndex = 0;

    document.addEventListener("keydown", handleKeystroke);
    return () => {
      document.removeEventListener("keydown", handleKeystroke);
    };
  }, [isFullscreen, isPlaying, ref]);

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

  // focus video after control interaction
  useEffect(() => {
    const controlsElement = document.querySelector(`.${styles.controls}`);

    const handleControlsInteraction = () => {
      if (ref.current) ref.current.focus();
    };

    if (controlsElement) {
      controlsElement.addEventListener("click", handleControlsInteraction);
      return () => {
        controlsElement.removeEventListener("click", handleControlsInteraction);
      };
    }
  }, [ref]);

  useEffect(() => {
    const updateProgressBar = () => {
      if (ref.current && isPlaying) {
        setCurrentTime(ref.current.currentTime);
        onTimeUpdate(ref.current.currentTime, ref.current.duration);
      }
      animationFrameRef.current = requestAnimationFrame(updateProgressBar);
    };

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateProgressBar);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, onTimeUpdate]);

  const toggleFullscreen = async () => {
    const window = getCurrentWindow();
    if (!isFullscreen) {
      divRef.current.requestFullscreen();
      // window.setFullscreen(true); // there is an issue with fullscreen and decorations: false;
    } else {
      document.exitFullscreen();
      window.setFullscreen(false);
    }
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
      setDuration(ref.current.duration);
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

    document.documentElement.style.setProperty("--volume", percentage);
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
        <div className={styles.progressBarContainer} onClick={handleSeek}>
          <div
            className={styles.progress}
            style={{ width: `${(currentTime / duration) * 100}%` }}
          ></div>
        </div>

        <div>
          <button onClick={togglePlayPause} className={styles.controlButton}>
            {isPlaying ? <MemoizedPause /> : <MemoizedPlay />}
          </button>

          <div className={styles.volumeControl}>
            <button onClick={toggleMute} className={styles.controlButton}>
              {isMuted || volume === 0 ? (
                <MemoizedVolumeX />
              ) : (
                <MemoizedVolume2 />
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

          <span className={styles.time}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <button
            className={`${styles.controlButton} ${styles.playbackContainer}`}
          >
            <MemoizedVideotape />
            {/* prettier-ignore */}
            <div className={`${styles.playbackOptions} ${playback !== 1 ? styles.playbackActive : "" }`}>
            <div className={styles.playback} onClick={() => changePlaybackRate(2)}>2x</div>
            <div className={styles.playback} onClick={() => changePlaybackRate(1.5)}>1.5x</div>
            <div className={styles.playback} onClick={() => changePlaybackRate(1)}>1x</div>
            <div className={styles.playback} onClick={() => changePlaybackRate(0.5)}>0.5x</div>
            <div className={styles.playback} onClick={() => changePlaybackRate(0.25)}>0.25x</div>
          </div>
          </button>

          <button onClick={toggleFullscreen} className={styles.controlButton}>
            {isFullscreen ? <MemoizedMinimize /> : <MemoizedMaximize />}
          </button>
        </div>
      </div>
    </div>
  );
});

export default Video;
