import styles from "./SettingButton.module.css";

const SettingButton = ({ func, text, tabIndex }) => {
  return (
    <button tabIndex={tabIndex} className={styles.settingButton} onClick={func}>
      {text}
    </button>
  );
};

export default SettingButton;
