import React, { useState, useCallback, Dispatch, SetStateAction, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import SettingButton from "./SettingButton";
import styles from "./Settings.module.css";
import gamesList from "../../assets/gamesList.json";
import { Settings } from "../types/settings";

type GameConfigFormProps = {
  removingIndex: number | null;
  setRemovingIndex: (index: number | null) => void;
  setSettings: Dispatch<SetStateAction<Settings>>;
  settings: Settings;
};

const GameConfigForm = React.memo<GameConfigFormProps>(
  ({ removingIndex, setRemovingIndex, setSettings, settings }) => {
    const [gameName, setGameName] = useState<string>("");
    const [processNames, setProcessNames] = useState<string>("");
    const [windowTitles, setWindowTitles] = useState<string>("");
    const [recordBool, setRecordBool] = useState<boolean>(false);
    const [isFormVisible, setIsFormVisible] = useState<boolean>(false);
    const [editingGame, setEditingGame] = useState<string | null>(null);
    const [gameSearchQuery, setGameSearchQuery] = useState<string>("");
    const [filteredGames, setFilteredGames] = useState<typeof gamesList>([]);
    const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          suggestionsRef.current &&
          !suggestionsRef.current.contains(e.target as Node) &&
          inputRef.current &&
          !inputRef.current.contains(e.target as Node)
        ) {
          setShowSuggestions(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleGameSearch = useCallback((query: string) => {
      setGameSearchQuery(query);
      setGameName(query);
      if (query.length === 0) {
        setFilteredGames([]);
        setShowSuggestions(false);
        return;
      }
      const queryLower = query.toLowerCase();
      const filtered = gamesList
        .filter(
          (game) =>
            game.Name.toLowerCase().includes(queryLower) ||
            (game.processName && game.processName.toLowerCase().includes(queryLower))
        )
        .slice(0, 10);
      setFilteredGames(filtered);
      setShowSuggestions(filtered.length > 0);
    }, []);

    const selectGame = useCallback((game: (typeof gamesList)[0]) => {
      setGameName(game.Name);
      setGameSearchQuery(game.Name);
      setProcessNames(game.processName || "");
      setWindowTitles(game.Name);
      setShowSuggestions(false);
    }, []);

    const handleSave = useCallback(() => {
      if (gameName && processNames) {
        const processArray = processNames.split(",").map((name) => name.trim());
        const windowTitlesArray = windowTitles
          .split(",")
          .map((title) => title.trim())
          .filter((title) => title.length > 0);

        setSettings((prevSettings: Settings) => {
          const updatedGamesConfig = { ...prevSettings.gamesConfig };

          updatedGamesConfig[gameName] = {
            processes: processArray,
            record: recordBool,
            windowTitles: windowTitlesArray.length > 0 ? windowTitlesArray : undefined,
          };

          return {
            ...prevSettings,
            gamesConfig: updatedGamesConfig,
          };
        });

        setGameName("");
        setProcessNames("");
        setWindowTitles("");
        setRecordBool(false);
        setIsFormVisible(false);
        setEditingGame(null);
      } else {
        alert("Both game name and process names are required!");
      }
    }, [gameName, processNames, windowTitles, recordBool, setSettings]);

    const startEditGame = useCallback(
      (gameName: string) => {
        const gameConfig = settings.gamesConfig[gameName];

        setEditingGame(gameName);
        setGameName(gameName);
        setGameSearchQuery(gameName);
        setProcessNames(gameConfig.processes.join(", "));
        setWindowTitles(gameConfig.windowTitles?.join(", ") || gameName);
        setRecordBool(gameConfig.record);
        setIsFormVisible(true);
      },
      [settings.gamesConfig],
    );

    const handleGameClick = useCallback(
      (index: number) => {
        setRemovingIndex(index);
      },
      [setRemovingIndex],
    );

    const removeGame = useCallback(
      (gameName: string) => {
        setRemovingIndex(null);

        setSettings((prevSettings) => {
          const updatedGamesConfig = { ...prevSettings.gamesConfig };
          delete updatedGamesConfig[gameName];
          return {
            ...prevSettings,
            gamesConfig: updatedGamesConfig,
          };
        });
      },
      [setSettings],
    );

    const toggleForm = useCallback(() => {
      setIsFormVisible((prev) => !prev);
      setEditingGame(null);
      setGameSearchQuery("");
      if (isFormVisible) {
        setTimeout(() => {
          setGameName("");
          setProcessNames("");
          setWindowTitles("");
          setRecordBool(false);
        }, 500);
      }
    }, [isFormVisible]);

    return (
      <div className={styles.settingIndividual}>
        <div className={styles.subSectionTitle}>
          <strong>Game Configurations</strong>
          <SettingButton
            text={isFormVisible ? "Cancel" : "Add Game"}
            func={toggleForm}
          />
        </div>

        <AnimatePresence initial={false}>
          {isFormVisible && (
            <motion.div
              className={`${styles.form} ${styles.addGameForm}`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: "hidden" }}
            >
              <div className={styles.inputGroup}>
                <label htmlFor="gameName">Game Name</label>
                <input
                  autoComplete="off"
                  id="gameName"
                  type="text"
                  value={gameSearchQuery}
                  onChange={(e) => handleGameSearch(e.target.value)}
                  onFocus={() => filteredGames.length > 0 && setShowSuggestions(true)}
                  ref={inputRef}
                  placeholder="Search or enter game name"

                  className={styles.nameInput}
                />
                {showSuggestions && (
                  <div className={styles.suggestionsDropdown} ref={suggestionsRef}>
                    {filteredGames.map((game, idx) => (
                      <div
                        key={idx}
                        className={styles.suggestionItem}
                        onClick={() => selectGame(game)}
                      >
                        <strong>{game.Name}</strong>
                        <span>{game.processName}</span>
                      </div>
                    ))}
                  </div>
                )}
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
              <div className={styles.inputGroup}>
                <label htmlFor="windowTitles">Window Titles</label>
                <input
                  autoComplete="off"
                  id="windowTitles"
                  type="text"
                  value={windowTitles}
                  onChange={(e) => setWindowTitles(e.target.value)}
                  placeholder="Enter window titles, separated by commas (optional)"
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
                />
              </div>

              <SettingButton
                func={handleSave}
                text={editingGame ? "Update Game" : "Save Game"}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className={styles.gamesContainer}>
          {settings.gamesConfig &&
            Object.keys(settings.gamesConfig).length > 0 ? (
            Object.entries(settings.gamesConfig).map(
              ([gameName, config], index) => (
                <div
                  className={`${styles.gameItem} ${styles.currentSetting} ${index === removingIndex ? styles.remove : ""
                    } ${gameName === editingGame ? styles.editing : ""} ${config.record ? styles.recording : ""
                    }`}
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (index !== removingIndex) {
                      handleGameClick(index);
                    }
                  }}
                >
                  <strong>{gameName}</strong>
                  <p>{config.processes.join(", ")}</p>
                  {index === removingIndex ? (
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
                  ) : null}
                </div>
              ),
            )
          ) : (
            <p>No games added yet.</p>
          )}
        </div>

        {settings.recordingMethod !== "obs" && (
          <div className={styles.themeDescription}>
            <p>WGC is selected. All sessions will be fully recorded.</p>
          </div>
        )}
      </div>
    );
  },
);

export default GameConfigForm;
