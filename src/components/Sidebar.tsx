import {
  GalleryThumbnails,
  LucideCirclePause,
  LucideCirclePlay,
  Settings,
} from "lucide-react";
import styles from "./Sidebar.module.css";
import { useSettings } from "../contexts/SettingsContext";

type SidebarProps = {
  setView: (view: string) => void;
  view: string;
  openSettings: () => void;
  settingsState: boolean;
};

const Sidebar: React.FC<SidebarProps> = ({
  setView,
  view,
  openSettings,
  settingsState,
}) => {
  const { settings } = useSettings();

  const isGamesDirSet = settings.gamesDir && settings.gamesDir.trim() !== "";

  const handleVideoClick = () => {
    if (isGamesDirSet) {
      setView("video");
    }
  };

  return (
    <aside className={styles.sidebar}>
      <div
        className={`${styles.button} ${styles.video} ${
          view === "video" ? styles.active : ""
        } ${!isGamesDirSet ? styles.disabled : ""}`}
        onClick={handleVideoClick}
        title={!isGamesDirSet ? "Please set games directory first" : ""}
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
