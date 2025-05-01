import React from "react";
import styles from "./SettingButton.module.css";

type SettingButtonProps = {
  func: () => void;
  text: string;
  tabIndex?: number;
  disabled?: boolean;
};

const SettingButton = React.memo<SettingButtonProps>(
  ({ func, text, tabIndex, disabled = false }) => {
    return (
      <button
        tabIndex={tabIndex}
        className={styles.settingButton}
        onClick={func}
        disabled={disabled}
      >
        {text}
      </button>
    );
  }
);

export default SettingButton;
