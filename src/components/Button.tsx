import React, { useState } from "react";
import styles from "./Button.module.css";
import ConfirmDialog from "./ConfirmDialog";

type ButtonProps = {
  onClick: () => void;
  children: React.ReactNode;
  tabIndex?: number;
  disabled?: boolean;
  protect: boolean;
};

const Button = React.memo<ButtonProps>(
  ({ onClick, children, tabIndex, disabled = false, protect = false }) => {
    const [showConfirm, setShowConfirm] = useState(false);

    let func;
    if (protect) {
      func = () => setShowConfirm(true);
    } else {
      func = onClick;
    }

    return (
      <>
        <button
          tabIndex={tabIndex}
          className={styles.button}
          onClick={func}
          disabled={disabled}
        >
          {children}
        </button>
        {protect && (
          <ConfirmDialog
            isOpen={showConfirm}
            title="Are you sure?"
            message="This action cannot be undone."
            confirmText="Yes"
            cancelText="Cancel"
            onConfirm={() => {
              setShowConfirm(false);
              onClick();
            }}
            onCancel={() => setShowConfirm(false)}
          />
        )}
      </>
    );
  },
);

export default Button;