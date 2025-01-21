import { useContext } from "react";
import GlobalContext from "../contexts/GlobalContext";
import styles from "./Settings.module.css";
import { open } from "@tauri-apps/plugin-dialog";
import { Folder, SettingsIcon } from "lucide-react";
import SettingButton from "./SettingButton";

const Settings = ({ isOpen }) => {
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

  const handleAddGame = async () => {
    const gameName = prompt("Enter the game name:");
    const processNames = prompt(
      "Enter the game process names (comma separated):"
    );

    if (gameName && processNames) {
      const processArray = processNames.split(",").map((name) => name.trim());

      setSettings((prevSettings) => ({
        ...prevSettings,
        gamesConfig: {
          ...prevSettings.gamesConfig,
          [gameName]: processArray,
        },
      }));
    } else {
      alert("Both game name and process names are required!");
    }
  };

  const removeGame = async (gameName) => {
    const confirmRemove = await window.confirm(
      `Are you sure you want to remove "${gameName}"?`
    );

    if (confirmRemove) {
      console.log("Xd");
      setSettings((prevSettings) => {
        const updatedGamesConfig = { ...prevSettings.gamesConfig };
        delete updatedGamesConfig[gameName];
        return {
          ...prevSettings,
          gamesConfig: updatedGamesConfig,
        };
      });
    }
  };

  return (
    <div
      className={`${styles.settingsContainer} ${isOpen ? "" : styles.closed}`}
    >
      <div className={`${styles.title} ${styles.mainTitle}`}>
        <SettingsIcon size={30} />
        <h1>Settings</h1>
      </div>
      <div className={`${styles.clipsDirectory} ${styles.settingItem}`}>
        <div className={styles.title}>
          <Folder />
          <h3 className={styles.sectionTitle}>Clips Storage</h3>
        </div>
        <div className={styles.settingContainer}>
          <div className={styles.subSectionTitle}>
            <strong>Clips Directory</strong>
            <SettingButton
              func={handleSelectDirectory}
              text={"Change Directory"}
            />
          </div>
          <div className={styles.currentDirectory}>
            <p>{settings.gamesDir}</p>
          </div>
        </div>
        <div className={styles.settingContainer}>
          <div className={styles.subSectionTitle}>
            <strong>Capturing Games</strong>
            <SettingButton func={handleAddGame} text={"Add Game"} />
          </div>
          <div>
            <ul>
              {settings.gamesConfig &&
              Object.keys(settings.gamesConfig).length > 0 ? (
                Object.entries(settings.gamesConfig).map(
                  ([gameName, processes], index) => (
                    <li
                      className={styles.gameItem}
                      onClick={() => removeGame(gameName)}
                      key={index}
                    >
                      {gameName} - {processes.join(",")}
                    </li>
                  )
                )
              ) : (
                <p>No games added yet.</p>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
