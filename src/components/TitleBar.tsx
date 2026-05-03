import styles from "./TitleBar.module.css";
import { X, Minus, Square, Copy, MinusSquare } from "lucide-react";
import React from "react";

const TitleBar = React.memo(() => {
  const handleMinimize = () => {
    window.electronAPI?.minimize?.();
  };

  const handleMaximize = () => {
    window.electronAPI?.maximize?.();
  };

  const handleClose = () => {
    window.electronAPI?.close?.();
  };

  return (
    <div className={styles.titleBar}>
      <div className={styles.dragRegion}></div>
      <div className={styles.windowControls}>
        <button onClick={handleMinimize} className={styles.controlButton}>
          <Minus size={18} />
        </button>
        <button onClick={handleMaximize} className={styles.controlButton}>
          <Square size={14} />
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