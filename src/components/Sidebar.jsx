import {
  GalleryThumbnails,
  LucideCirclePause,
  LucideCirclePlay,
  Settings,
} from "lucide-react";
import styles from "./Sidebar.module.css";

const Sidebar = ({ setView, view, openSettings, settingsState }) => {
  return (
    <aside className={styles.sidebar}>
      <div
        className={`${styles.button} ${styles.video} ${
          view === "video" ? styles.active : ""
        }`}
        onClick={() => setView("video")}
      >
        {view !== "video" ? <LucideCirclePlay /> : <LucideCirclePause />}
      </div>
      <div
        className={`${styles.button} ${styles.clips} ${
          view === "clips" ? styles.active : ""
        }`}
        onClick={() => setView("clips")}
      >
        <GalleryThumbnails />
      </div>
      <div
        className={`${styles.button} ${styles.settings} ${
          settingsState && styles.activeSettings
        }`}
        onClick={() => openSettings()}
        data-role="settings"
      >
        <Settings />
      </div>
    </aside>
  );
};

export default Sidebar;
