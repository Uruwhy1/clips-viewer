import { forwardRef, useCallback, useEffect, useState } from "react";
import styles from "./Settings.module.css";
import { open } from "@tauri-apps/plugin-dialog";
import { Aperture, Folder, LucideSettings2 } from "lucide-react";
import SettingButton from "./SettingButton";

import ObsConnectionForm from "./ObsConnectionForm";
import GameConfigForm from "./GameConfigForm";

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { usePopup } from "../contexts/PopupContext";
import { useSettings } from "../contexts/SettingsContext";

const Settings = forwardRef(({ isOpen, obs, setObs }, ref) => {
  const { settings, setSettings } = useSettings();

  const [removingIndex, setRemovingIndex] = useState(null);
  const [tempThreshold, setTempThreshold] = useState(
    settings.clipsDeleteThreshold | 9999999
  );

  const [isBackingUp, setIsBackingUp] = useState(false);
  const {
    showPopup,
    showPersistentNotification,
    removePersistentNotification,
  } = usePopup();

  useEffect(() => {
    let unlisten;

    async function setupListener() {
      unlisten = await listen("backup-progress", (event) => {
        const payload = event.payload;
        const {
          status,
          current,
          total,
          success_count,
          failed_count,
          current_file,
        } = payload;

        const percent = total > 0 ? Math.floor((current / total) * 100) : 0;
        const backupId = "backup-process";

        // Update persistent notification with progress
        showPersistentNotification(backupId, {
          mainText: status,
          progressText: [
            `${current} of ${total} (${success_count} succeeded, ${failed_count} failed)`,
            `${current_file ? `Current: ${current_file}` : ""}`,
          ],
          progress: percent,
          isComplete: percent === 100,
        });

        // When complete, update the notification after a delay
        if (percent === 100) {
          setTimeout(() => {
            const finalText =
              failed_count === 0
                ? `Backup completed successfully! ${success_count} files backed up.`
                : `Backup completed with issues. ${success_count} succeeded, ${failed_count} failed.`;

            showPersistentNotification(backupId, {
              mainText: finalText,
              progress: 100,
              isComplete: true,
            });

            setIsBackingUp(false);
          }, 1000);
        }
      });
    }

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, [showPersistentNotification]);

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
    setTempThreshold(settings.clipsDeleteThreshold || 99999999);
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
      showPopup(`Directory changed to ${selectedDir}`, true);
    }
  };

  const handleToggleBorders = () => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      scrollbarOff: !prevSettings.scrollbarOff,
    }));
    showPopup(
      `Scrollbars turned ${settings.scrollbarOff ? "on" : "off"}.`,
      true
    );
  };

  const handleToggleClipDeletion = () => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      clipDeletion: !prevSettings.clipDeletion,
    }));
    showPopup(
      `Automatic clip deletion turned ${!settings.clipDeletion ? "on" : "off"}`,
      true
    );
  };

  const handleBackup = async () => {
    try {
      const backupId = "backup-process";

      removePersistentNotification(backupId);

      setIsBackingUp(true);

      const selectedPath = await open({
        directory: true,
        multiple: false,
        title: "Select Backup Destination Folder",
      });

      if (!selectedPath) {
        setIsBackingUp(false);
        return;
      }

      showPersistentNotification(backupId, {
        text: "Starting backup process...",
        progress: 0,
      });

      invoke("backup_favourite_clips", {
        backupDir: selectedPath,
      }).catch((err) => {
        console.error("Backup failed:", err);
        showPersistentNotification(backupId, {
          text: `Backup failed: ${err}`,
          progress: 100,
          isComplete: true,
        });
        setIsBackingUp(false);
      });
    } catch (err) {
      console.error("Backup process error:", err);
      showPopup(`Backup process error: ${err}`, false);
      setIsBackingUp(false);
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
            showPopup("Failed to connect to OBS", false);
          }}
          initialPort={settings.obs?.port || ""}
          initialPassword={settings.obs?.password || ""}
          onConnectionSuccess={(obsConfig) => {
            setObs(`Connected to OBS (${obsConfig.version})`);
            setSettings((prev) => ({ ...prev, obs: obsConfig }));
            showPopup(`Connected to OBS (${obsConfig.version})`, true);
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
