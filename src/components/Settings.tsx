import React, { forwardRef, useCallback, useEffect, useState } from "react";
import styles from "./Settings.module.css";
import { open } from "@tauri-apps/plugin-dialog";
import { Aperture, Folder, LucideSettings2, Palette } from "lucide-react";
import SettingButton from "./SettingButton";

import ObsConnectionForm from "./ObsConnectionForm";
import GameConfigForm from "./GameConfigForm";

import { invoke } from "@tauri-apps/api/core";
import { usePopup } from "../contexts/PopupContext";
import { useSettings } from "../contexts/SettingsContext";
import { ThemeFamilyControl } from "./ThemeFamily";
import { AppearanceModeControl } from "./ThemeAppearance";
import AccentColor from "./AccentColor";
import { RecordingMethod, SemanticColor } from "../types/settings";

type SettingsProps = {
  isOpen: boolean;
};

const Settings = forwardRef<HTMLDivElement, SettingsProps>(
  ({ isOpen }, ref) => {
    const { settings, setSettings } = useSettings();

    const [removingIndex, setRemovingIndex] = useState<number | null>(null);
    const [tempThreshold, setTempThreshold] = useState(
      settings.clipsDeleteThreshold || 9999999,
    );

    const [isBackingUp, setIsBackingUp] = useState(false);
    const {
      showPopup,
      showPersistentNotification,
      removePersistentNotification,
    } = usePopup();

    function debounce<T extends (...args: any[]) => void>(
      func: T,
      wait: number,
    ): (...args: Parameters<T>) => void {
      let timeout: ReturnType<typeof setTimeout>;
      return function(this: ThisParameterType<T>, ...args: Parameters<T>) {
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
      [],
    );

    const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setTempThreshold(Number(value));
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
        true,
      );
    };

    const handleToggleClipDeletion = () => {
      setSettings((prevSettings) => ({
        ...prevSettings,
        clipDeletion: !prevSettings.clipDeletion,
      }));
      showPopup(
        `Automatic clip deletion turned ${!settings.clipDeletion ? "on" : "off"
        }`,
        true,
      );
    };

    const handleToggleRecordingSound = () => {
      setSettings((prevSettings) => ({
        ...prevSettings,
        recordingSoundEnabled: !prevSettings.recordingSoundEnabled,
      }));
      showPopup(
        `Recording sound notifications turned ${!settings.recordingSoundEnabled ? "on" : "off"
        }.`,
        true,
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
          mainText: "Starting backup process...",
          progress: 0,
        });

        invoke("backup_favourite_clips", {
          backupDir: selectedPath,
        }).catch((err) => {
          console.error("Backup failed:", err);
          showPersistentNotification(backupId, {
            mainText: `Backup failed: ${err}`,
            progress: 100,
            isComplete: true,
          });
          setIsBackingUp(false);
        });
      } catch (err) {
        console.error("Backup process error:", err);
        showPopup(`Backup process error: ${err}`, false);
        setIsBackingUp(false);
      } finally {
        setIsBackingUp(false);
      }
    };

    const handleThemeClick = (newTheme: string) => {
      setSettings((prevSettings) => ({
        ...prevSettings,
        theme: newTheme,
      }));
      showPopup(`Theme changed to ${newTheme}.`, true);
    };

    const handleAccentChange = (semanticColor: SemanticColor) => {
      document.documentElement.style.setProperty(
        "--accent-var",
        `var(${semanticColor.variable})`,
      );

      setSettings((prevSettings) => ({
        ...prevSettings,
        accentVariable: semanticColor.variable,
      }));

      showPopup(`Accent color changed to ${semanticColor.name}.`, true);
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
              className={`${styles.currentSetting} ${!settings.clipDeletion ? styles.inactive : ""
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
            <h3>Recording</h3>
            <SettingButton text={"OBS"} func={() => console.log("Xd")} />
          </div>

          {settings.recordingMethod === "obs" && <ObsConnectionForm />}
          <GameConfigForm
            settings={settings}
            setSettings={setSettings}
            removingIndex={removingIndex}
            setRemovingIndex={setRemovingIndex}
          />

          <div className={styles.settingIndividual}>
            <div className={styles.subSectionTitle}>
              <strong>Recording Sound Notifications</strong>
              <SettingButton
                text={settings.recordingSoundEnabled ? "On" : "Off"}
                func={handleToggleRecordingSound}
              />
            </div>
          </div>
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

          <AppearanceModeControl
            currentTheme={settings.theme}
            switchTheme={handleThemeClick}
          />

          <ThemeFamilyControl
            currentTheme={settings.theme}
            switchTheme={handleThemeClick}
          />

          <AccentColor
            currentAccent={settings.accentVariable || "--red"}
            onAccentChange={handleAccentChange}
          />
        </div>
      </div>
    );
  },
);

export default Settings;
