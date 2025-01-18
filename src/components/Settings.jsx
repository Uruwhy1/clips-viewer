import { useContext, useState } from "react";
import GlobalContext from "../contexts/GlobalContext";
import styles from "./Settings.module.css";
import { open } from "@tauri-apps/plugin-dialog";

const Settings = () => {
  const { settings, setSettings } = useContext(GlobalContext);
  const [newGamesDir, setNewGamesDir] = useState(settings.gamesDir || "");

  const handleSave = () => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      gamesDir: newGamesDir,
    }));
  };

  const handleSelectFolder = async () => {
    const selectedDir = await open({
      directory: true,
      multiple: false,
    });

    if (selectedDir) {
      setNewGamesDir(selectedDir);
    }
  };

  return (
    <div className={styles.settingsContainer}>
      <h2>Settings</h2>
      <p>Current Settings:</p>
      <div>
        {Object.entries(settings).map(([key, value]) => (
          <p key={key}>
            <strong>{key}:</strong> {value || "Not set"}
          </p>
        ))}
      </div>
      <div>
        <label htmlFor="gamesDir">Games Directory:</label>
        <input
          type="text"
          id="gamesDir"
          value={newGamesDir}
          onChange={(e) => setNewGamesDir(e.target.value)}
        />
        <button onClick={handleSelectFolder}>Select Folder</button>{" "}
        <button onClick={handleSave}>Save</button>
      </div>
    </div>
  );
};

export default Settings;
