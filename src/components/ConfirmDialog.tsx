import { AnimatePresence } from "motion/react";
import OverlayModal from "./OverlayModal";
import styles from "./ConfirmDialog.module.css";
import { TriangleAlert } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) => (
  <AnimatePresence>
    {isOpen && (
      <OverlayModal onClick={onCancel}>
        <div className={styles.dialog}>
          <div className={styles.header}>
            <div className={styles.iconCircle}>
              <TriangleAlert size={24} />
            </div>

            <h2 className={styles.title}>{title}</h2>
            <p className={styles.message}>{message}</p>
          </div>

          <div className={styles.buttons}>
            <button className={styles.cancelButton} onClick={onCancel}>
              {cancelText}
            </button>
            <button className={styles.confirmButton} onClick={onConfirm}>
              {confirmText}
            </button>
          </div>
        </div>
      </OverlayModal>
    )}
  </AnimatePresence>
);

export default ConfirmDialog;
