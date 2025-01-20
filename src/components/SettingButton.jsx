import styles from "./SettingButton.module.css";

const SettingButton = ({ func, text }) => {
  return (
    <button className={styles.settingButton} onClick={func}>
      {text}
    </button>
  );
};

export default SettingButton;
