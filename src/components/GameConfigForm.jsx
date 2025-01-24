import React, { useState } from "react";
import SettingButton from "./SettingButton";
import styles from "./Settings.module.css";

const GameConfigForm = React.memo(
  ({ removingIndex, setRemovingIndex, setSettings, settings }) => {
    const [gameName, setGameName] = useState("");
    const [processNames, setProcessNames] = useState("");
    const [recordBool, setRecordBool] = useState("");
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingGame, setEditingGame] = useState(null);

    const handleSave = () => {
      if (gameName && processNames) {
        const processArray = processNames.split(",").map((name) => name.trim());

        setSettings((prevSettings) => {
          const updatedGamesConfig = { ...prevSettings.gamesConfig };

          updatedGamesConfig[gameName] = {
            processes: processArray,
            record: recordBool,
          };

          return {
            ...prevSettings,
            gamesConfig: updatedGamesConfig,
          };
        });

        setGameName("");
        setProcessNames("");
        setRecordBool(false);
        setIsFormVisible(false);
        setEditingGame(null);
      } else {
        alert("Both game name and process names are required!");
      }
    };

    const startEditGame = (gameName) => {
      const gameConfig = settings.gamesConfig[gameName];

      setEditingGame(gameName);
      setGameName(gameName);
      setProcessNames(gameConfig.processes.join(", "));
      setRecordBool(gameConfig.record);
      setIsFormVisible(true);
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
      <div className={styles.settingIndividual}>
        <div className={styles.subSectionTitle}>
          <strong>Game Configurations</strong>
          <SettingButton
            text={isFormVisible ? "Cancel" : "Add Game"}
            func={() => {
              setIsFormVisible((prev) => !prev);
              setEditingGame(null);
              setTimeout(() => {
                setGameName("");
                setProcessNames("");
                setRecordBool(false);
              }, 500);
            }}
          />
        </div>
        <div
          className={`${styles.form} ${isFormVisible && styles.active} ${
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
              tabIndex={isFormVisible ? 0 : -1}
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
              tabIndex={isFormVisible ? 0 : -1}
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="recordBool">Record Full Sessions</label>
            <input
              autoComplete="off"
              id="recordBool"
              type="checkbox"
              checked={recordBool}
              className={styles.checkboxInput}
              onChange={(e) => setRecordBool(e.target.checked)}
              tabIndex={isFormVisible ? 0 : -1}
            />
          </div>
          <SettingButton
            tabIndex={isFormVisible ? 0 : -1}
            func={handleSave}
            text={editingGame ? "Update Game" : "Save Game"}
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
                  } ${gameName == editingGame ? styles.editing : ""}
                    ${config.record ? styles.recording : ""}`}
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (index != removingIndex) {
                      handleGameClick(index);
                    }
                  }}
                >
                  <strong>{gameName}</strong>
                  <p>{config.processes.join(", ")}</p>
                  {index == removingIndex ? (
                    <>
                      <button onClick={() => removeGame(gameName)}>
                        Remove
                      </button>
                      <button
                        className={styles.edit}
                        onClick={() => {
                          startEditGame(gameName);
                          setRemovingIndex(null);
                        }}
                      >
                        Edit
                      </button>
                    </>
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
    );
  }
);

export default GameConfigForm;
