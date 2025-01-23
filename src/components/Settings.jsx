import { forwardRef, useContext, useState } from "react";
import GlobalContext from "../contexts/GlobalContext";
import styles from "./Settings.module.css";
import { open } from "@tauri-apps/plugin-dialog";
import { Aperture, Folder, SettingsIcon } from "lucide-react";
import SettingButton from "./SettingButton";

import ObsConnectionForm from "./ObsConnectionForm";
import GameConfigForm from "./GameConfigForm";

const Settings = forwardRef(({ isOpen, obs, setObs }, ref) => {
  const { settings, setSettings } = useContext(GlobalContext);
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
        <ObsConnectionForm
          obs={obs}
          onConnectionFailure={() => {
            setObs(`Failed to connect.`);
          }}
          initialPort={settings.obs?.port || ""}
          initialPassword={settings.obs?.password || ""}
          onConnectionSuccess={(obsConfig) => {
            setObs(`Connected to OBS (${obsConfig.version})`);
            setSettings((prev) => ({ ...prev, obs: obsConfig }));
          }}
        />
        <GameConfigForm
          settings={settings}
          setSettings={setSettings}
          removingIndex={removingIndex}
          setRemovingIndex={setRemovingIndex}
        />
      </div>
    </div>
  );
});

export default Settings;
