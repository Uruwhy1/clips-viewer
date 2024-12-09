import styles from "./TitleBar.module.css";
import { X, Minus, Square, Copy } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";

const TitleBar = () => {
  Square;
  const currentWindow = getCurrentWindow();
  const [maximized, setMaximized] = useState(null);

  useEffect(() => {
    async function set() {
      setMaximized(await currentWindow.isMaximized());
    }
    set();
  }, []);

  const handleMinimize = () => {
    currentWindow.minimize();
  };

  const handleMaximize = async () => {
    const isMaximized = await currentWindow.isMaximized();
    if (isMaximized) {
      currentWindow.unmaximize();
    } else {
      currentWindow.maximize();
    }

    setMaximized(!isMaximized);
  };

  const handleClose = () => {
    currentWindow.close();
  };

  return (
    <div className={styles.titleBar} data-tauri-drag-region>
      <div className={styles.dragRegion} data-tauri-drag-region></div>
      <div className={styles.windowControls}>
        <button onClick={handleMinimize} className={styles.controlButton}>
          <Minus size={18} />
        </button>
        <button onClick={handleMaximize} className={styles.controlButton}>
          {!maximized ? <Square size={14} /> : <Copy size={16} />}
        </button>
        <button
          onClick={handleClose}
          className={`${styles.controlButton} ${styles.closeButton}`}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
