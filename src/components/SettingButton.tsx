import React from "react";
import Button from "../components/Button";

type SettingButtonProps = {
  func: () => void;
  text: string;
  tabIndex?: number;
  disabled?: boolean;
};

const SettingButton = React.memo<SettingButtonProps>(
  ({ func, text, tabIndex, disabled = false }) => {
    return (
      <Button onClick={func} tabIndex={tabIndex} disabled={disabled}>
        {text}
      </Button>
    );
  },
);

export default SettingButton;
