import React, {
  useState,
  forwardRef,
  useRef,
  useEffect,
  RefObject,
  ForwardedRef,
  useCallback,
} from "react";
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
  Minus,
  LucideTriangle,
} from "lucide-react";
import styles from "./Video.module.css";
import EditingControls from "./EditingControls";
import { Clip } from "../types/clip";

const MemoizedPlay = React.memo(() => <Play size={20} />);
const MemoizedPause = React.memo(() => <Pause size={20} />);
const MemoizedVolumeX = React.memo(() => <VolumeX size={20} />);
const MemoizedVolume2 = React.memo(() => <Volume2 size={20} />);
const MemoizedMinimize = React.memo(() => <Minimize size={20} />);
const MemoizedMaximize = React.memo(() => <Maximize size={20} />);
const MemoizedVideotape = React.memo(() => <Settings2 size={20} />);
const MemoizedTriangle = React.memo(() => <LucideTriangle size={16} />);
const MemoizedRotatedTriangle = React.memo(() => (
  <LucideTriangle size={16} style={{ rotate: "180deg" }} />
));
const MemoizedMinus = React.memo(() => <Minus size={16} />);

interface VideoProps {
  currentClip: Clip;
}

const Video = forwardRef<HTMLVideoElement, VideoProps>(
  ({ currentClip }, ref: ForwardedRef<HTMLVideoElement>) => {
    const [isPlaying, setIsPlaying] = useState<boolean>(true);
    const [isMuted, setIsMuted] = useState<boolean>(true);
    const [volume, setVolume] = useState<number>(1);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [playback, setPlayback] = useState<number | null>(null);
    const divRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number | null>(null);

    const [startMarker, setStartMarker] = useState<number | null>(null);
    const [endMarker, setEndMarker] = useState<number | null>(null);

    useEffect(() => {
      handleVolumeChange(false);
    }, []);

    useEffect(() => {
      setIsPlaying(true);
    }, [currentClip]);

    useEffect(() => {
      const handleKeystroke = (e: KeyboardEvent) => {
        if (
          ref &&
          "current" in ref &&
          ref.current &&
          document.activeElement === ref.current
        ) {
          switch (e.key) {
            case "Escape":
              if (isFullscreen) {
                e.stopPropagation();
                toggleFullscreen();
              }
              break;
            case "ArrowLeft":
              ref.current.currentTime = Math.max(
                0,
                ref.current.currentTime - 5,
              );
              setCurrentTime(ref.current.currentTime);
              break;
            case "ArrowRight":
              ref.current.currentTime = Math.min(
                ref.current.duration,
                ref.current.currentTime + 5,
              );
              setCurrentTime(ref.current.currentTime);
              break;
            case " ":
              togglePlayPause();
              break;
          }
        }
      };

      if (ref && "current" in ref && ref.current) {
        ref.current.tabIndex = 0;
      }

      document.addEventListener("keydown", handleKeystroke);
      return () => {
        document.removeEventListener("keydown", handleKeystroke);
      };
    }, [isFullscreen, isPlaying, ref]);

    const handleControlsInteraction = () => {
      if (ref && "current" in ref && ref.current) ref.current.focus();
    };

    useEffect(() => {
      const updateProgressBar = () => {
        if (ref && "current" in ref && ref.current && isPlaying) {
          setCurrentTime(ref.current.currentTime);
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
    }, [isPlaying]);

    useEffect(() => {
      const handleFullscreenChange = () => {
        const isCurrentlyFullscreen = !!document.fullscreenElement;
        setIsFullscreen(isCurrentlyFullscreen);
      };

      document.addEventListener("fullscreenchange", handleFullscreenChange);

      return () => {
        document.removeEventListener(
          "fullscreenchange",
          handleFullscreenChange,
        );
      };
    }, []);

    const toggleFullscreen = async () => {
      try {
        if (!document.fullscreenElement && divRef.current) {
          await divRef.current.requestFullscreen();
        } else if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
      } catch (error) {
        console.error("Fullscreen error:", error);
        setIsFullscreen(!!document.fullscreenElement);
      }
    };

    const togglePlayPause = () => {
      if (ref && "current" in ref && ref.current) {
        if (isPlaying) {
          ref.current.pause();
        } else {
          ref.current.play();
        }
        setIsPlaying(!isPlaying);
      }
    };

    const toggleMute = () => {
      if (ref && "current" in ref && ref.current) {
        ref.current.muted = !isMuted;
        setIsMuted(!isMuted);
      }

      if (ref && "current" in ref && ref.current && ref.current.muted) {
        handleVolumeChange(false);
      } else {
        handleVolumeChange(volume);
      }
    };

    const formatTime = (time: number): string => {
      const hours = Math.floor(time / 3600);
      const minutes = Math.floor((time % 3600) / 60)
        .toString()
        .padStart(2, "0");
      const seconds = Math.floor(time % 60)
        .toString()
        .padStart(2, "0");

      let string =
        hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;

      return string;
    };

    const handleTimeUpdate = () => {
      if (ref && "current" in ref && ref.current) {
        setDuration(ref.current.duration);
      }

      if (
        ref &&
        "current" in ref &&
        ref.current &&
        ref.current.currentTime === duration
      ) {
        console.log("Xd");
        setIsPlaying(false);
      }
    };

    const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
      if (ref && "current" in ref && ref.current) {
        const target = event.target as HTMLDivElement;
        const newTime =
          (event.nativeEvent.offsetX / target.offsetWidth) * duration;
        ref.current.currentTime = newTime;
        setCurrentTime(newTime);
      }
    };

    const changePlaybackRate = (rate?: number) => {
      if (ref && "current" in ref && ref.current) {
        if (rate === undefined) {
          ref.current.playbackRate = 1;
        } else {
          ref.current.playbackRate += rate;
        }
        setPlayback(ref.current.playbackRate);
      }
    };

    const handleVolumeChange = (
      e: React.ChangeEvent<HTMLInputElement> | number | boolean,
    ) => {
      let value = 0;
      let max = 1;

      if (typeof e === "number") {
        value = e;
      } else if (e && typeof e !== "boolean" && "target" in e) {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (newVolume === 0) {
          setIsMuted(true);
        } else {
          setIsMuted(false);
        }
        value = parseFloat(e.target.value);
        max = parseFloat(e.target.max) || 1;
      }

      if (ref && "current" in ref && ref.current) {
        ref.current.volume = value;
      }
      const percentage = value / max;

      document.documentElement.style.setProperty(
        "--volume",
        percentage.toString(),
      );
    };

    const getStartMarkerPosition = (): number | null => {
      if (startMarker === null || duration === 0) return null;
      return (startMarker / duration) * 100;
    };

    const getEndMarkerPosition = (): number | null => {
      if (endMarker === null || duration === 0) return null;
      return (endMarker / duration) * 100;
    };

    const startMarkerPos = getStartMarkerPosition();
    const endMarkerPos = getEndMarkerPosition();

    const handleMarkerUpdate = useCallback(
      (start: number | null, end: number | null) => {
        setStartMarker(start);
        setEndMarker(end);
      },
      [],
    );

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
          onDoubleClick={toggleFullscreen}
          autoPlay
        ></video>
        <div className={styles.controls}>
          <div className={styles.progressBarContainer} onClick={handleSeek}>
            <div
              className={styles.progress}
              style={{ width: `${(currentTime / duration) * 100}%` }}
            ></div>

            {startMarkerPos !== null && (
              <div
                className={styles.marker}
                style={{ left: `${startMarkerPos}%` }}
                title={`Start: ${formatTime(startMarker as number)}`}
              />
            )}

            {endMarkerPos !== null && (
              <div
                className={styles.marker}
                style={{ left: `${endMarkerPos}%` }}
                title={`End: ${formatTime(endMarker as number)}`}
              />
            )}

            {startMarkerPos !== null &&
              endMarkerPos !== null &&
              startMarkerPos < endMarkerPos && (
                <div
                  className={styles.selectedRange}
                  style={{
                    left: `${startMarkerPos}%`,
                    width: `${endMarkerPos - startMarkerPos}%`,
                  }}
                />
              )}
          </div>

          <div className={styles.controlBar}>
            <div>
              <button
                onClick={togglePlayPause}
                className={styles.controlButton}
              >
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
                    onChange={(e) => handleVolumeChange(e)}
                  />
                </div>
              </div>

              <span className={styles.time}>
                {formatTime(currentTime)} / {formatTime(duration | 0)}
              </span>
            </div>
            <EditingControls
              videoRef={ref as RefObject<HTMLVideoElement>}
              onMarkersUpdate={handleMarkerUpdate}
            />
            <div className={styles.rightControls}>
              <button
                className={`${styles.controlButton} ${styles.playbackContainer}`}
              >
                {/* prettier-ignore */}
                <div className={`${styles.playbackOptions} ${playback !== 1 ? styles.playbackActive : ""}`}>
                  <div className={styles.playback} onClick={() => changePlaybackRate(0.5)}>
                    <MemoizedTriangle />
                  </div>
                  <div className={styles.playback} onClick={() => changePlaybackRate()}>
                    <MemoizedMinus />
                  </div>
                  <div className={styles.playback} onClick={() => changePlaybackRate(-0.25)}>
                    <MemoizedRotatedTriangle />
                  </div>
                </div>
                <MemoizedVideotape />
              </button>

              <button
                onClick={toggleFullscreen}
                className={styles.controlButton}
              >
                {isFullscreen ? <MemoizedMinimize /> : <MemoizedMaximize />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

export default Video;
