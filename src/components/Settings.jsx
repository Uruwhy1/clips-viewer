import { useContext } from "react";
import GlobalContext from "../contexts/GlobalContext";
import styles from "./Settings.module.css";
import { open } from "@tauri-apps/plugin-dialog";
import { Folder, SettingsIcon } from "lucide-react";

const Settings = () => {
  const { settings, setSettings } = useContext(GlobalContext);

  const handleSelectDirectory = async () => {
    const selectedDir = await open({
      directory: true,
      multiple: false,
    });

    if (selectedDir) {
      setSettings((prevSettings) => ({
        ...prevSettings,
        gamesDir: selectedDir,
      }));
    }
  };

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.title}>
        <SettingsIcon size={30} />
        <h1>Settings</h1>
      </div>
      <div className={`${styles.clipsDirectory} ${styles.settingItem}`}>
        <div className={styles.title}>
          <Folder />
          <h3 className={styles.sectionTitle}>Clips Storage</h3>
        </div>
        <div className={styles.settingContainer}>
          <div className={styles.setting}>
            <strong>Clips Directory:</strong>
            <p>{settings.gamesDir}</p>
          </div>
          <button
            className={styles.selectFolderButton}
            onClick={handleSelectDirectory}
          >
            Select Games Directory
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
