import { GalleryThumbnails, LucideCirclePlay, Settings } from "lucide-react";
import styles from "./Sidebar.module.css";

const Sidebar = ({ setView, openSettings }) => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.button} onClick={() => setView("video")}>
        <LucideCirclePlay />
      </div>
      <div className={styles.button} onClick={() => setView("clips")}>
        <GalleryThumbnails />
      </div>
      <div
        className={`${styles.button} ${styles.settings}`}
        onClick={() => openSettings()}
        data-role="settings"
      >
        <Settings />
      </div>
    </aside>
  );
};

export default Sidebar;
