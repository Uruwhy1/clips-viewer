import { useOBS } from "../contexts/ObsContext";
import React, { useState, useCallback, useContext, useEffect } from "react";
import SettingButton from "./SettingButton";
import styles from "./Settings.module.css";

const ObsConnectionForm = React.memo(() => {
  const { obsSetting, setObsSetting, connect, connection } = useOBS();
  const [obsPort, setObsPort] = useState("");
  const [obsPassword, setObsPassword] = useState("");
  const [isFormVisible, setIsFormVisible] = useState(false);

  useEffect(() => {
    setObsPassword(obsSetting.password);
    setObsPort(obsSetting.port);
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
      setIsFormVisible(false);
    }
  }, [obsPort, obsPassword]);

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
      <div
        className={`${styles.form} ${isFormVisible && styles.active} ${
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
            placeholder={obsSetting.port}
            tabIndex={isFormVisible ? 0 : -1}
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
            tabIndex={isFormVisible ? 0 : -1}
          />
        </div>
        <SettingButton
          tabIndex={isFormVisible ? 0 : -1}
          func={handleObsClick}
          text="Connect"
        />
      </div>
      <div className={styles.currentSetting}>{getConnectionStatus()}</div>
    </div>
  );
});

export default ObsConnectionForm;
