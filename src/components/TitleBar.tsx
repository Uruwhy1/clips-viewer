import styles from "./TitleBar.module.css";
import { X, Minus, Square, Copy } from "lucide-react";
import { getCurrentWindow, Window } from "@tauri-apps/api/window";
import React, { useEffect, useState } from "react";

const TitleBar = React.memo(() => {
  Square;
  const currentWindow: Window = getCurrentWindow();
  const [maximized, setMaximized] = useState<boolean | null>(null);

  useEffect(() => {
    async function set() {
      setMaximized(await currentWindow.isMaximized());
    }
    set();
  }, []);

  const handleMinimize = () => {
    currentWindow.minimize();
    currentWindow.hide();
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
});

export default TitleBar;
