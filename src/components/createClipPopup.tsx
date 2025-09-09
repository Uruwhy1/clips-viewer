import React, { useState, useEffect } from "react";
import styles from "./CreateClipPopup.module.css";
import { Plus, X } from "lucide-react";
import { Clip } from "../types/clip";

interface CreateClipPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateNew: (name: string) => void;
  currentClip: Clip | null;
  startTime: number | null;
  endTime: number | null;
}

const CreateClipPopup: React.FC<CreateClipPopupProps> = ({
  isOpen,
  onClose,
  onCreateNew,
  currentClip,
  startTime,
  endTime,
}) => {
  const [clipName, setClipName] = useState("");

  useEffect(() => {
    if (isOpen && currentClip) {
      const defaultName = currentClip.name.replace(/\.[^/.]+$/, "") + " Clip";
      setClipName(defaultName);
    }
  }, [isOpen, currentClip]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCreateNew = () => {
    if (clipName.trim()) {
      onCreateNew(clipName.trim());
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreateNew();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen || !currentClip || !startTime || !endTime) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Create Clip</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.clipInfo}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Original:</span>
              <span className={styles.value}>{currentClip.name}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Duration:</span>
              <span className={styles.value}>
                {formatTime(startTime)} - {formatTime(endTime)}
                <span className={styles.duration}>
                  ({formatTime(endTime - startTime)})
                </span>
              </span>
            </div>
          </div>

          <div className={styles.nameInput}>
            <label htmlFor="clipName" className={styles.label}>
              Clip Name:
            </label>
            <input
              id="clipName"
              type="text"
              value={clipName}
              onChange={(e) => setClipName(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter clip name..."
              className={styles.input}
              autoFocus
            />
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.button} onClick={onClose}>
            Cancel
          </button>
          <button
            className={`${styles.button} ${styles.createButton}`}
            onClick={handleCreateNew}
            disabled={!clipName.trim()}
          >
            <Plus size={16} />
            Create New
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateClipPopup;
