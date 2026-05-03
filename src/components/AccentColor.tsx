import React from "react";
import styles from "./Settings.module.css";
import { SemanticColor } from "../types/settings";

const semanticColors: SemanticColor[] = [
  { name: "Red", variable: "--red", previewColor: "#f38ba8" },
  { name: "Blue", variable: "--blue", previewColor: "#89b4fa" },
  { name: "Green", variable: "--green", previewColor: "#a6e3a1" },
  { name: "Mauve", variable: "--mauve", previewColor: "#cba6f7" },
  { name: "Peach", variable: "--peach", previewColor: "#fab387" },
  { name: "Yellow", variable: "--yellow", previewColor: "#f9e2af" },
  { name: "Teal", variable: "--teal", previewColor: "#94e2d5" },
  { name: "Lavender", variable: "--lavender", previewColor: "#b4befe" },
];

interface AccentColorProps {
  currentAccent: string;
  onAccentChange: (color: SemanticColor) => void;
}

const AccentColor: React.FC<AccentColorProps> = ({
  currentAccent,
  onAccentChange,
}) => {
  const getCurrentColor = (): SemanticColor => {
    const found = semanticColors.find(
      (option) => option.variable === currentAccent
    );
    return found || semanticColors[0];
  };

  const currentColor = getCurrentColor();

  return (
    <div className={styles.settingIndividual}>
      <div className={styles.subSectionTitle}>
        <strong>Accent Color</strong>
      </div>
      <div className={styles.colorOptions}>
        {semanticColors.map((option) => (
          <div
            key={option.name}
            className={`${styles.colorItem} ${
              currentColor.variable === option.variable
                ? styles.activeColor
                : ""
            }`}
            onClick={() => onAccentChange(option)}
            style={{
              backgroundColor:
                getComputedStyle(document.documentElement).getPropertyValue(
                  option.variable
                ) || option.previewColor,
            }}
            title={option.name}
          >
            {currentColor.variable === option.variable && (
              <span className={styles.colorSelectedIndicator}>✓</span>
            )}
          </div>
        ))}
      </div>
      <div className={styles.themeDescription}>
        <p>Choose the accent color used throughout the application.</p>
      </div>
    </div>
  );
};

export default AccentColor;
