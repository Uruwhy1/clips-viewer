import React, { memo, useState } from "react";
import styles from "./CurrentVideo.module.css";
import { Save } from "lucide-react";

const MemoizedSave = React.memo(({ ...props }) => <Save {...props} />);

const RenameInput = memo(({ clip, onRename }) => {
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
          console.log(title);
          setTitle(e.target.value);
        }}
      />
      <MemoizedSave className={styles.titleButton} onClick={handleSave} />
    </div>
  );
});

export default RenameInput;
