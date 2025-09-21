import React from "react";
import styles from "./Button.module.css";

type ButtonProps = {
  onClick: () => void;
  children: React.ReactNode;
  tabIndex?: number;
  disabled?: boolean;
  protect: boolean;
};

const Button = React.memo<ButtonProps>(
  ({ onClick, children, tabIndex, disabled = false, protect = false }) => {
    let func;
    if (protect) {
      func = async () => {
        const response = await window.confirm("Are you sure!?");
        if (response) {
          onClick();
        } else {
          console.log("no!");
        }
      };
    } else {
      func = onClick;
    }

    return (
      <button
        tabIndex={tabIndex}
        className={styles.button}
        onClick={func}
        disabled={disabled}
      >
        {children}
      </button>
    );
  },
);

export default Button;
