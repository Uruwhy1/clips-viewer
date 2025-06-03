import React from "react";
import styles from "./Settings.module.css";
import { ThemeFamily, ThemeModeType } from "../types/settings";

export const ThemeFamilyControl: React.FC<{
  currentTheme: string;
  switchTheme: (newTheme: string) => void;
}> = ({ currentTheme, switchTheme }) => {
  const selectedFamily =
    currentTheme.includes("Catppuccin") ||
    currentTheme === "Mocha" ||
    currentTheme === "Latte"
      ? "Catppuccin"
      : "Default";

  const getCurrentMode = (): "System" | "Light" | "Dark" => {
    if (currentTheme.includes("System")) {
      return "System";
    } else if (currentTheme === "Light" || currentTheme === "Latte") {
      return "Light";
    } else if (currentTheme === "Dark" || currentTheme === "Mocha") {
      return "Dark";
    }
    return "System";
  };

  const currentMode: ThemeModeType = getCurrentMode();

  const handleFamilyChange = (family: ThemeFamily) => {
    if (family === "Default") {
      if (currentMode === "System") {
        switchTheme("System (Default)");
      } else {
        switchTheme(currentMode);
      }
    } else if (family === "Catppuccin") {
      if (currentMode === "System") {
        switchTheme("System (Catppuccin)");
      } else if (currentMode === "Light") {
        switchTheme("Latte");
      } else if (currentMode === "Dark") {
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
          className={`${styles.themeItem} ${
            selectedFamily === "Default" ? styles.active : ""
          }`}
          onClick={() => handleFamilyChange("Default")}
        >
          <div className={styles.themeItemContent}>
            <span className={styles.themeIcon}>🎨</span>
            <p>Default</p>
            {selectedFamily === "Default" && (
              <span className={styles.activeIndicator}>✓</span>
            )}
          </div>
        </div>
        <div
          className={`${styles.themeItem} ${
            selectedFamily === "Catppuccin" ? styles.active : ""
          }`}
          onClick={() => handleFamilyChange("Catppuccin")}
        >
          <div className={styles.themeItemContent}>
            <span className={styles.themeIcon}>🎭</span>
            <p>Catppuccin</p>
            {selectedFamily === "Catppuccin" && (
              <span className={styles.activeIndicator}>✓</span>
            )}
          </div>
        </div>
      </div>
      <div className={styles.themeDescription}>
        {selectedFamily === "Default" && (
          <p>Classic UI theme with standard light and dark options.</p>
        )}
        {selectedFamily === "Catppuccin" && (
          <p>A pastel theme with soft colors that's easy on the eyes.</p>
        )}
      </div>
    </div>
  );
};
