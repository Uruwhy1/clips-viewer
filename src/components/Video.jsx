import { useEffect, forwardRef } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import styles from "./Video.module.css";
import { getCurrentWindow } from "@tauri-apps/api/window";

const Video = forwardRef(({ currentClip, onTimeUpdate }, ref) => {
  useEffect(() => {
    const handleFullscreenChange = async () => {
      const window = getCurrentWindow();
      const current = await window.isFullscreen();
      window.setFullscreen(!current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    // Cleanup the event listener
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const handleTimeUpdate = () => {
    if (ref.current) {
      onTimeUpdate(ref.current.currentTime, ref.current.duration);
    }
  };

  return (
    <div className={styles.videoContainer}>
      <video
        ref={ref}
        id="video"
        controls
        muted
        src={convertFileSrc(currentClip.filePath)}
        onTimeUpdate={handleTimeUpdate}
        className={styles.video}
        autoPlay
      ></video>
    </div>
  );
});

export default Video;
