import styles from "./Settings.module.css";
import { ThemeMode } from "./ThemeMode";

export const AppearanceModeControl: React.FC<{
  currentTheme: string;
  switchTheme: (newTheme: string) => void;
  selectedFamily: string;
}> = ({ currentTheme, switchTheme, selectedFamily }) => {
  // Extract the mode from current theme
  const getCurrentMode = (): string => {
    if (currentTheme.includes("System")) {
      return "System";
    } else if (currentTheme === "Light" || currentTheme === "Latte") {
      return "Light";
    } else if (currentTheme === "Dark" || currentTheme === "Mocha") {
      return "Dark";
    }
    return "System";
  };

  const selectedMode = getCurrentMode();

  // Apply new mode but keep the same theme family
  const handleModeChange = (mode: string) => {
    if (selectedFamily === "Default") {
      if (mode === "System") {
        switchTheme("System (Default)");
      } else {
        switchTheme(mode); // "Light" or "Dark"
      }
    } else if (selectedFamily === "Catppuccin") {
      if (mode === "System") {
        switchTheme("System (Catppuccin)");
      } else if (mode === "Light") {
        switchTheme("Latte");
      } else if (mode === "Dark") {
        switchTheme("Mocha");
      }
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
