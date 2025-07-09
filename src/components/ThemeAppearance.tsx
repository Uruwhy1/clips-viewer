import { ThemeModeType } from "../types/settings";
import styles from "./Settings.module.css";
import { ThemeMode } from "./ThemeMode";

export const AppearanceModeControl: React.FC<{
  currentTheme: string;
  switchTheme: (newTheme: string) => void;
}> = ({ currentTheme, switchTheme }) => {
  const getCurrentMode = (): string => {
    if (currentTheme.includes("System")) {
      return "System";
    } else if (currentTheme === "Latte") {
      return "Light";
    } else if (currentTheme === "Mocha") {
      return "Dark";
    }
    return "System";
  };

  const selectedMode = getCurrentMode();

  const handleModeChange = (mode: ThemeModeType) => {
    if (mode === "System") {
      switchTheme("System (Catppuccin)");
    } else if (mode === "Light") {
      switchTheme("Latte");
    } else if (mode === "Dark") {
      switchTheme("Mocha");
    }
  };

  return (
    <div className={styles.settingIndividual}>
      <div className={styles.subSectionTitle}>
        <strong>Appearance Mode</strong>
      </div>
      <div className={`${styles.gamesContainer}`}>
        <ThemeMode
          title="Light"
          current={selectedMode}
          onClick={handleModeChange}
        />
        <ThemeMode
          title="Dark"
          current={selectedMode}
          onClick={handleModeChange}
        />
        <ThemeMode
          title="System"
          current={selectedMode}
          onClick={handleModeChange}
        />
      </div>
      <div className={styles.themeDescription}>
        {selectedMode === "System" && (
          <p>
            Uses your system preferences to automatically switch between light
            and dark.
          </p>
        )}
        {selectedMode === "Light" && (
          <p>Always uses light appearance regardless of system settings.</p>
        )}
        {selectedMode === "Dark" && (
          <p>Always uses dark appearance regardless of system settings.</p>
        )}
      </div>
    </div>
  );
};
