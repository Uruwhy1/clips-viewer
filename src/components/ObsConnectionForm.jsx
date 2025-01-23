import { useState } from "react";
import { checkOBSStatus, connectOBS } from "../helpers/OBS";
import SettingButton from "./SettingButton";
import styles from "./Settings.module.css";

const ObsConnectionForm = ({
  initialPort = "",
  initialPassword = "",
  onConnectionSuccess,
  onConnectionFailure,
  obs,
}) => {
  const [obsPort, setObsPort] = useState(initialPort);
  const [obsPassword, setObsPassword] = useState(initialPassword);
  const [isFormVisible, setIsFormVisible] = useState(false);

  const handleObsClick = async () => {
    if (!obsPort || !obsPassword) {
      alert("Both port and password are required!");
      return;
    }

    await connectOBS(obsPort, obsPassword);

    let status = await checkOBSStatus();
    if (status.connected) {
      onConnectionSuccess({
        port: obsPort,
        password: obsPassword,
        version: status.version,
      });
      setIsFormVisible(false);
    } else {
      onConnectionFailure();
      setIsFormVisible(false);
    }
  };

  return (
    <div className={styles.settingIndividual}>
      <div className={styles.subSectionTitle}>
        <strong>Websocket Connection</strong>
        <SettingButton
          text={isFormVisible ? "Cancel" : "Connect"}
          func={() => setIsFormVisible((prev) => !prev)}
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
            placeholder="Enter OBS port"
            tabIndex={isFormVisible ? 0 : -1}
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
            tabIndex={isFormVisible ? 0 : -1}
          />
        </div>
        <SettingButton
          tabIndex={isFormVisible ? 0 : -1}
          func={handleObsClick}
          text="Connect"
        />
      </div>
      <div className={styles.currentSetting}>{obs}</div>
    </div>
  );
};

export default ObsConnectionForm;
