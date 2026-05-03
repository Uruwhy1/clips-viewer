import React, { memo, useState } from "react";
import styles from "./CurrentVideo.module.css";
import { LucideProps, Save } from "lucide-react";
import { Clip } from "../types/clip";

const MemoizedSave = React.memo((props: LucideProps) => <Save {...props} />);

type RenameInputProps = {
  clip: Clip;
  onRename: (clip: Clip, title: string) => void;
};

const RenameInput = memo<RenameInputProps>(({ clip, onRename }) => {
  const [title, setTitle] = useState(clip.name);

  const handleSave = () => {
    onRename(clip, title);
  };

  return (
    <div>
      <input
        autoFocus
        className={styles.titleRename}
        type="text"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
        }}
      />
      <MemoizedSave className={styles.titleButton} onClick={handleSave} />
    </div>
  );
});

export default RenameInput;
