import { useState } from "react";
import styles from "./AddGameDialog.module.css";

const AddGameDialog = ({ isOpen, onClose, onAddGame }) => {
  const [gameName, setGameName] = useState("");
  const [processNames, setProcessNames] = useState("");

  const handleSubmit = () => {
    if (gameName && processNames) {
      const processArray = processNames.split(",").map((name) => name.trim());
      onAddGame(gameName, processArray);
      setGameName("");
      setProcessNames("");
      onClose();
    } else {
      alert("Both game name and process names are required!");
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.dialogOverlay} data-role="settings">
      <div className={styles.dialogBox}>
        <h2>Add Game</h2>
        <div className={styles.inputGroup}>
          <label htmlFor="gameName">Game Name</label>
          <input
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
            id="processNames"
            type="text"
            value={processNames}
            onChange={(e) => setProcessNames(e.target.value)}
            placeholder="Enter process names, separated by commas"
          />
        </div>
        <div className={styles.dialogActions}>
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSubmit}>Add Game</button>
        </div>
      </div>
    </div>
  );
};

export default AddGameDialog;
