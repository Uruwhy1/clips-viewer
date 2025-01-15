import { GalleryThumbnails, LucideCirclePlay, Settings } from "lucide-react";
import styles from "./Sidebar.module.css";

const Sidebar = ({ setView }) => {
  return (
    <div className={styles.sidebar}>
      <div className={styles.button} onClick={() => setView("video")}>
        <LucideCirclePlay />
      </div>
      <div className={styles.button} onClick={() => setView("clips")}>
        <GalleryThumbnails />
      </div>
      <div
        className={`${styles.button} ${styles.settings}`}
        onClick={() => setView("settings")}
      >
        <Settings />
      </div>
    </div>
  );
};

export default Sidebar;
