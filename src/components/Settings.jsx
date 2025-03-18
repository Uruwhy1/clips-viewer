import {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import GlobalContext from "../contexts/GlobalContext";
import styles from "./Settings.module.css";
import { open } from "@tauri-apps/plugin-dialog";
import { Aperture, Folder, LucideSettings2 } from "lucide-react";
import SettingButton from "./SettingButton";

import ObsConnectionForm from "./ObsConnectionForm";
import GameConfigForm from "./GameConfigForm";

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

const Settings = forwardRef(({ isOpen, obs, setObs }, ref) => {
  const { settings, setSettings } = useContext(GlobalContext);
  const [removingIndex, setRemovingIndex] = useState(null);
  const [tempThreshold, setTempThreshold] = useState(
    settings.clipsDeleteThreshold
  );

  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupStatus, setBackupStatus] = useState(null);
  const [backupProgress, setBackupProgress] = useState(null);

  useEffect(() => {
    let unlisten;

    async function setupListener() {
      unlisten = await listen("backup-progress", (event) => {
        setBackupProgress(event.payload);
      });
    }

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  const debouncedHandleChangeDeletionThreshold = useCallback(
    debounce((value) => {
      setSettings((prevSettings) => ({
        ...prevSettings,
        clipsDeleteThreshold: parseInt(value, 10),
      }));
    }, 300),
    []
  );

  const handleRangeChange = (e) => {
    const value = e.target.value;
    setTempThreshold(value);
    debouncedHandleChangeDeletionThreshold(value);
  };

  useEffect(() => {
    setTempThreshold(settings.clipsDeleteThreshold);
  }, [settings.clipsDeleteThreshold]);

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

  const handleToggleClipDeletion = () => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      clipDeletion: !prevSettings.clipDeletion,
    }));
  };

  const handleBackup = async () => {
    try {
      setIsBackingUp(true);
      setBackupStatus(null);
      setBackupProgress(null);

      const selectedPath = await open({
        directory: true,
        multiple: false,
        title: "Select Backup Destination Folder",
      });
      if (!selectedPath) {
        setIsBackingUp(false);
        return;
      }

      const result = await invoke("backup_favourite_clips", {
        backupDir: selectedPath,
      });
      setBackupStatus(result);

      setTimeout(() => {
        setBackupProgress(null);
      }, 5000);
    } catch (err) {
      console.error("Backup failed:", err);
      setBackupStatus(`Backup failed: ${err}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  const renderBackupStatus = () => {
    if (!backupProgress && !backupStatus) {
      return null;
    }

    if (backupProgress) {
      const {
        status,
        current,
        total,
        success_count,
        failed_count,
        current_file,
      } = backupProgress;
      const percent = total > 0 ? Math.floor((current / total) * 100) : 0;

      return (
        <div className={styles.backingUp}>
          <h4>{status}</h4>
          <div className={styles.progressBarContainer}>
            <div
              className={styles.progressBar}
              style={{ width: `${percent}%` }}
            ></div>
          </div>
          <p>
            {current} of {total} files ({percent}%)
            {current_file && <span> - Current: {current_file}</span>}
          </p>
          <p>
            Success: {success_count} | Failed: {failed_count}
          </p>
        </div>
      );
    }

    return (
      <div className={styles.backingUp}>
        <p>{backupStatus}</p>
      </div>
    );
  };

  return (
    <>
      {isBackingUp ? renderBackupStatus() : ""}
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
            <SettingButton
              text={isBackingUp ? "Backing Up..." : "Backup Favourites"}
              func={handleBackup}
              disabled={isBackingUp}
            />
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
          <div className={styles.settingIndividual}>
            <div className={styles.subSectionTitle}>
              <strong>Automatic Clips Deletion</strong>
              <SettingButton
                text={!settings.clipDeletion ? "Off" : "On"}
                func={handleToggleClipDeletion}
              />
            </div>
            <div
              className={`${styles.currentSetting} ${
                !settings.clipDeletion ? styles.inactive : ""
              } `}
            >
              <input
                type="range"
                min={1}
                max={5000}
                value={tempThreshold}
                onChange={handleRangeChange}
              />
              <span className={styles.rangeValue}>{tempThreshold} GB</span>
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
    </>
  );
});

export default Settings;
