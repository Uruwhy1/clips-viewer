import { useRecording } from "../contexts/RecordingContext";
import { useSettings } from "../contexts/SettingsContext";
import { saveSettings } from "../helpers/settingsFile";
import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import SettingButton from "./SettingButton";
import styles from "./Settings.module.css";

const ObsConnectionForm = React.memo(() => {
  const { obsSetting, setObsSetting, connect, connection } = useRecording();
  const { settings } = useSettings();
  const [obsPort, setObsPort] = useState("");
  const [obsPassword, setObsPassword] = useState("");
  const [isFormVisible, setIsFormVisible] = useState(false);

  useEffect(() => {
    setObsPassword(obsSetting.password || "");
    setObsPort(obsSetting.port || "");
  }, [obsSetting]);

  const toggleFormVisibility = useCallback(() => {
    setIsFormVisible((prev) => !prev);
  }, []);

  const handleObsClick = useCallback(async () => {
    if (!obsPort || !obsPassword) {
      alert("Both port and password are required!");
      return;
    }

    const success = await connect(obsPort, obsPassword);
    if (success) {
      setObsSetting({
        port: obsPort,
        password: obsPassword,
      });
      const newSettings = {
        ...settings,
        obs: { port: obsPort, password: obsPassword },
      };
      await saveSettings(newSettings);
      setIsFormVisible(false);
    }
  }, [obsPort, obsPassword, connect, setObsSetting, settings]);

  const getConnectionStatus = () => {
    switch (connection.status) {
      case "connected":
        return `Connected to OBS (${connection.version})`;
      case "error":
        return `Connection failed.`;
      default:
        return "Disconnected";
    }
  };

  return (
    <div className={styles.settingIndividual}>
      <div className={styles.subSectionTitle}>
        <strong>Websocket Connection</strong>
        <SettingButton
          text={isFormVisible ? "Cancel" : "Connect"}
          func={toggleFormVisibility}
        />
      </div>

      <AnimatePresence initial={false}>
        {isFormVisible && (
          <motion.div
            className={styles.form}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div className={styles.inputGroup}>
              <label htmlFor="obsPort">Port</label>
              <input
                autoComplete="off"
                id="obsPort"
                type="text"
                value={obsPort}
                onChange={(e) => setObsPort(e.target.value)}
                placeholder={obsSetting.port || ""}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="obsPassword">Password</label>
              <input
                autoComplete="off"
                id="obsPassword"
                type="password"
                placeholder="Password here..."
                value={obsPassword}
                onChange={(e) => setObsPassword(e.target.value)}
              />
            </div>
            <SettingButton func={handleObsClick} text="Connect" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className={styles.currentSetting}>{getConnectionStatus()}</div>
    </div>
  );
});

export default ObsConnectionForm;
