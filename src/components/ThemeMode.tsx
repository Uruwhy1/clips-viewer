import { ThemeModeType } from "../types/settings";
import styles from "./Settings.module.css";

interface ThemeModeProps {
  title: ThemeModeType;
  current: string;
  onClick: (newMode: ThemeModeType) => void;
}

export const ThemeMode: React.FC<ThemeModeProps> = ({
  title,
  current,
  onClick,
}) => {
  const getIcon = () => {
    switch (title) {
      case "Dark":
        return "🌙";
      case "Light":
        return "☀️";
      case "System":
        return "⚙️";
      default:
        return "";
    }
  };

  return (
    <div
      className={`${styles.themeItem} ${
        current === title ? styles.active : ""
      }`}
      onClick={() => onClick(title)}
    >
      <div className={styles.themeItemContent}>
        <span className={styles.themeIcon}>{getIcon()}</span>
        <p>{title}</p>
        {current === title && <span className={styles.activeIndicator}>✓</span>}
      </div>
    </div>
  );
};
