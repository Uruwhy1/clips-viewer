import React from "react";
import styles from "./Settings.module.css";
import { ThemeFamily, ThemeModeType } from "../types/settings";

export const ThemeFamilyControl: React.FC<{
  currentTheme: string;
  switchTheme: (newTheme: string) => void;
}> = ({ currentTheme, switchTheme }) => {
  const handleFamilyChange = (family: ThemeFamily) => {
    if (family === "Catppuccin") {
      if (currentTheme.includes("System")) {
        switchTheme("System (Catppuccin)");
      } else if (currentTheme.includes("Light")) {
        switchTheme("Latte");
      } else if (currentTheme.includes("Dark")) {
        switchTheme("Mocha");
      }
    }
  };

  return (
    <div className={styles.settingIndividual}>
      <div className={styles.subSectionTitle}>
        <strong>Theme Family</strong>
      </div>
      <div className={`${styles.gamesContainer}`}>
        <div
          className={`${styles.themeItem} ${styles.active}`}
          onClick={() => handleFamilyChange("Catppuccin")}
        >
          <div className={styles.themeItemContent}>
            <span className={styles.themeIcon}>🎭</span>
            <p>Catppuccin</p>
            <span className={styles.activeIndicator}>✓</span>
          </div>
        </div>
      </div>
      <div className={styles.themeDescription}>
        <p>A pastel theme with soft colors that's easy on the eyes.</p>
      </div>
    </div>
  );
};
