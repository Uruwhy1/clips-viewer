import { forwardRef, useContext, useState } from "react";
import GlobalContext from "../contexts/GlobalContext";
import styles from "./Settings.module.css";
import { open } from "@tauri-apps/plugin-dialog";
import { Aperture, Folder, SettingsIcon } from "lucide-react";
import SettingButton from "./SettingButton";
import { checkOBSStatus, connectOBS } from "../helpers/OBS";

const Settings = forwardRef(({ isOpen, obs, setObs }, ref) => {
  const { settings, setSettings } = useContext(GlobalContext);
  const [gameName, setGameName] = useState("");
  const [processNames, setProcessNames] = useState("");
  const [showAddGameForm, setShowAddGameForm] = useState(false);
  const [removingIndex, setRemovingIndex] = useState(null);

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

  const handleAddGame = () => {
    if (gameName && processNames) {
      const processArray = processNames.split(",").map((name) => name.trim());
      setSettings((prevSettings) => ({
        ...prevSettings,
        gamesConfig: {
          ...prevSettings.gamesConfig,
          [gameName]: processArray,
        },
      }));
      setGameName("");
      setProcessNames("");
      setShowAddGameForm(false);
    } else {
      alert("Both game name and process names are required!");
    }
  };

  const handleObsClick = async () => {
    await connectOBS();

    let status = await checkOBSStatus();
    if (status.connected) {
      setObs(`Connected to OBS (${status.version})`);
    } else {
      setObs("Failed to connect.");
    }
  };

  const handleGameClick = (index) => {
    setRemovingIndex(index);
  };

  const removeGame = async (gameName) => {
    setRemovingIndex(null);

    setSettings((prevSettings) => {
      const updatedGamesConfig = { ...prevSettings.gamesConfig };
      delete updatedGamesConfig[gameName];
      return {
        ...prevSettings,
        gamesConfig: updatedGamesConfig,
      };
    });
  };

  return (
    <div
      className={`${styles.settingsContainer} ${isOpen ? "" : styles.closed}`}
      ref={ref}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={`${styles.title} ${styles.mainTitle}`}>
        <SettingsIcon size={30} />
        <h1>Settings</h1>
      </div>
      <div className={`${styles.settingCategory}`}>
        <div className={styles.title}>
          <Folder />
          <h3>Storage</h3>
        </div>
        <div className={styles.settingIndividual}>
          <div className={styles.subSectionTitle}>
            <strong>Clips Directory</strong>
            <SettingButton
              func={handleSelectDirectory}
              text={"Change Directory"}
            />
          </div>
          <div
            className={`${styles.currentSetting} ${styles.currentDirectory}`}
          >
            <p>{settings.gamesDir}</p>
          </div>
        </div>
      </div>
      <div className={`${styles.settingCategory}`}>
        <div className={styles.title}>
          <Aperture />
          <h3>OBS</h3>
        </div>
        <div className={styles.settingIndividual}>
          <div className={styles.subSectionTitle}>
            <strong>Websocket Connection</strong>
            <SettingButton text={"Connect"} func={handleObsClick} />
          </div>
          <div className={styles.currentSetting}>{obs}</div>
        </div>
        <div className={styles.settingIndividual}>
          <div className={styles.subSectionTitle}>
            <strong>Game Configurations</strong>
            <SettingButton
              text={showAddGameForm ? "Cancel" : "Add Game"}
              func={() => setShowAddGameForm((prev) => !prev)}
            />
          </div>
          {showAddGameForm && (
            <div className={styles.addGameForm}>
              <div className={styles.inputGroup}>
                <label htmlFor="gameName">Game Name</label>
                <input
                  autoComplete="off"
                  id="gameName"
                  type="text"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  placeholder="Enter game name"
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="processNames">Game Processes</label>
                <input
                  autoComplete="off"
                  id="processNames"
                  type="text"
                  value={processNames}
                  onChange={(e) => setProcessNames(e.target.value)}
                  placeholder="Enter process names, separated by commas"
                />
              </div>
              <SettingButton func={handleAddGame} text={"Save Game"} />
            </div>
          )}
          <div className={styles.gamesContainer}>
            {settings.gamesConfig &&
            Object.keys(settings.gamesConfig).length > 0 ? (
              Object.entries(settings.gamesConfig).map(
                ([gameName, processes], index) => (
                  <div
                    className={`${styles.gameItem} ${styles.currentSetting} ${
                      index == removingIndex ? styles.remove : ""
                    }`}
                    key={index}
                    onClick={
                      index == removingIndex ? "" : () => handleGameClick(index)
                    }
                  >
                    {index == removingIndex ? (
                      <button onClick={() => removeGame(gameName)}>
                        Remove?
                      </button>
                    ) : (
                      <>
                        <strong>{gameName}</strong>
                        <p>{processes.join(", ")}</p>
                      </>
                    )}
                  </div>
                )
              )
            ) : (
              <p>No games added yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default Settings;
