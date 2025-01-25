import React from "react";
import styles from "./SettingButton.module.css";

const SettingButton = React.memo(({ func, text, tabIndex }) => {
  return (
    <button tabIndex={tabIndex} className={styles.settingButton} onClick={func}>
      {text}
    </button>
  );
});

export default SettingButton;
