import {
  CirclePlus,
  GalleryThumbnails,
  LucideCirclePause,
  LucideCirclePlay,
  Plus,
  Settings,
} from "lucide-react";
import styles from "./Sidebar.module.css";
import { useSettings } from "../contexts/SettingsContext";
import { Dispatch, SetStateAction } from "react";

type SidebarProps = {
  setView: Dispatch<SetStateAction<string>>;
  view: string;
  openSettings: () => void;
  settingsState: boolean;
  newClipsState: boolean;
  newClipsNumber: number;
  setNewClipsState: Dispatch<SetStateAction<boolean>>;
};

const Sidebar: React.FC<SidebarProps> = ({
  setView,
  view,
  openSettings,
  settingsState,
  newClipsState,
  newClipsNumber,
  setNewClipsState,
}) => {
  const { settings } = useSettings();
  const isGamesDirSet = settings.gamesDir && settings.gamesDir.trim() !== "";

  const handleVideoClick = () => {
    if (isGamesDirSet) {
      setView("video");
    }
  };

  const handleClipsClick = () => {
    setNewClipsState(false);
    setView("clips");
  };

  const handleNewClipsClick = () => {
    if (newClipsNumber > 0) {
      setNewClipsState(!newClipsState);
    }
  };

  return (
    <aside className={styles.sidebar}>
      <div
        className={`${styles.button} ${styles.video} ${view === "video" ? styles.active : ""
          } ${!isGamesDirSet ? styles.disabled : ""}`}
        onClick={handleVideoClick}
        title={!isGamesDirSet ? "Please set games directory first" : ""}
      >
        {view !== "video" ? <LucideCirclePlay /> : <LucideCirclePause />}
      </div>
      <div
        className={`${styles.button} ${styles.clips} ${view === "clips" && !newClipsState ? styles.active : ""
          }`}
        onClick={handleClipsClick}
      >
        <GalleryThumbnails />
      </div>

      {newClipsNumber > 0 && (
        <div
          className={`${styles.button} ${styles.newClips} ${newClipsState ? styles.active : ""
            }`}
          onClick={handleNewClipsClick}
          title="New Clips"
        >
          <Plus />
        </div>
      )}
      <div
        className={`${styles.button} ${styles.settings} ${settingsState && styles.active
          }`}
        onClick={openSettings}
        data-role="settings"
      >
        <Settings />
      </div>
    </aside>
  );
};

export default Sidebar;
