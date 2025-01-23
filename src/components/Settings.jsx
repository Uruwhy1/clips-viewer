import { forwardRef, useContext, useState } from "react";
import GlobalContext from "../contexts/GlobalContext";
import styles from "./Settings.module.css";
import { open } from "@tauri-apps/plugin-dialog";
import { Aperture, Folder, SettingsIcon } from "lucide-react";
import SettingButton from "./SettingButton";
import { checkOBSStatus, connectOBS } from "../helpers/OBS";

const Settings = forwardRef(({ isOpen, obs, setObs }, ref) => {
  const { settings, setSettings } = useContext(GlobalContext);

  const [showAddGameForm, setShowAddGameForm] = useState(false);
  const [gameName, setGameName] = useState("");
  const [processNames, setProcessNames] = useState("");
  const [recordBool, setRecordBool] = useState(false);

  const [removingIndex, setRemovingIndex] = useState(null);

  const [showObsForm, setShowObsForm] = useState(false);
  const [obsPort, setObsPort] = useState(settings.obs?.port || "");
  const [obsPassword, setObsPassword] = useState(settings.obs?.password || "");

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
          [gameName]: {
            processes: processArray,
            record: recordBool,
          },
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
    if (!obsPort || !obsPassword) {
      alert("Both port and password are required!");
      return;
    }

    await connectOBS(obsPort, obsPassword);

    let status = await checkOBSStatus();
    if (status.connected) {
      setObs(`Connected to OBS (${status.version})`);
      setShowObsForm(false);

      const updatedObsConfig = { port: obsPort, password: obsPassword };

      setSettings((prevSettings) => {
        return {
          ...prevSettings,
          obs: updatedObsConfig,
        };
      });
    } else {
      setObs("Failed to connect.");

      setObsPort("");
      setObsPassword("");
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
      onClick={(e) => {
        e.stopPropagation();
        setRemovingIndex(null);
      }}
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
            <SettingButton
              text={showObsForm ? "Cancel" : "Connect"}
              func={() => setShowObsForm((prev) => !prev)}
            />
          </div>
          <div className={styles.currentSetting}>{obs}</div>
          <div
            className={`${styles.form} ${showObsForm && styles.active} ${
              styles.addWebsocketForm
            }`}
          >
            <div className={styles.inputGroup}>
              <label htmlFor="obsPort">Port</label>
              <input
                autoComplete="off"
                id="obsPort"
                type="text"
                value={obsPort}
                onChange={(e) => setObsPort(e.target.value)}
                placeholder="Enter OBS port"
                tabIndex={showObsForm ? 0 : -1}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="obsPassword">Password</label>
              <input
                autoComplete="off"
                id="obsPassword"
                type="password"
                value={obsPassword}
                onChange={(e) => setObsPassword(e.target.value)}
                placeholder="Enter OBS password"
                tabIndex={showObsForm ? 0 : -1}
              />
            </div>
            <SettingButton
              tabIndex={showObsForm ? 0 : -1}
              func={handleObsClick}
              text={"Connect"}
            />
          </div>
        </div>
        <div className={styles.settingIndividual}>
          <div className={styles.subSectionTitle}>
            <strong>Game Configurations</strong>
            <SettingButton
              text={showAddGameForm ? "Cancel" : "Add Game"}
              func={() => setShowAddGameForm((prev) => !prev)}
            />
          </div>
          <div
            className={`${styles.form} ${showAddGameForm && styles.active} ${
              styles.addGameForm
            }`}
          >
            <div className={styles.inputGroup}>
              <label htmlFor="gameName">Game Name</label>
              <input
                autoComplete="off"
                id="gameName"
                type="text"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder="Enter game name"
                tabIndex={showAddGameForm ? 0 : -1}
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
                tabIndex={showAddGameForm ? 0 : -1}
              />
            </div>{" "}
            <div className={styles.inputGroup}>
              <label htmlFor="recordBool">Record Full Sessions</label>
              <input
                autoComplete="off"
                id="recordBool"
                type="checkbox"
                value={recordBool}
                className={styles.checkboxInput}
                onChange={(e) => setRecordBool(e.target.checked)}
                tabIndex={showAddGameForm ? 0 : -1}
              />
            </div>
            <SettingButton
              tabIndex={showAddGameForm ? 0 : -1}
              func={handleAddGame}
              text={"Save Game"}
            />
          </div>
          <div className={styles.gamesContainer}>
            {settings.gamesConfig &&
            Object.keys(settings.gamesConfig).length > 0 ? (
              Object.entries(settings.gamesConfig).map(
                ([gameName, config], index) => (
                  <div
                    className={`${styles.gameItem} ${styles.currentSetting} ${
                      index == removingIndex ? styles.remove : ""
                    }`}
                    key={index}
                    onClick={
                      index == removingIndex
                        ? ""
                        : (e) => {
                            e.stopPropagation();
                            handleGameClick(index);
                          }
                    }
                  >
                    <strong>{gameName}</strong>
                    <p>{config.processes.join(", ")}</p>
                    {index == removingIndex ? (
                      <button onClick={() => removeGame(gameName)}>
                        Remove?
                      </button>
                    ) : (
                      ""
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
