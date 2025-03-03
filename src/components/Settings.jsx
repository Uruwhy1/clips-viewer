import { forwardRef, useContext, useState } from "react";
import GlobalContext from "../contexts/GlobalContext";
import styles from "./Settings.module.css";
import { open } from "@tauri-apps/plugin-dialog";
import { Aperture, Folder, LucideSettings2, SettingsIcon } from "lucide-react";
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

  const handleToggleBorders = () => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      scrollbarOff: !prevSettings.scrollbarOff,
    }));
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
      <div className={`${styles.settingCategory}`}>
        <div className={styles.title}>
          <LucideSettings2 />
          <h3>UI Tweaks</h3>
        </div>
        <div className={styles.settingIndividual}>
          <div className={styles.subSectionTitle}>
            <strong>Visible Scrollbars</strong>
            <SettingButton
              text={settings.scrollbarOff ? "Off" : "On"}
              func={handleToggleBorders}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

export default Settings;
