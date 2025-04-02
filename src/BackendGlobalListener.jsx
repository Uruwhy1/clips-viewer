import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { usePopup } from "./contexts/PopupContext";

const PersistentListener = ({ children }) => {
  const { showPersistentNotification } = usePopup();
  useEffect(() => {
    let unlistenClip, unlistenBackup;

    async function setupListeners() {
      // clip creation progress
      unlistenClip = await listen("clip-progress", (event) => {
        const { main_text, progress_text, progress, is_complete } =
          event.payload;
        const popupId = "clip-process";

        showPersistentNotification(popupId, {
          mainText: main_text,
          progressText: [progress_text],
          progress,
          isComplete: is_complete,
        });
      });

      // backing up progress
      unlistenBackup = await listen("backup-progress", (event) => {
        const {
          status,
          current,
          total,
          success_count,
          failed_count,
          current_file,
        } = event.payload;

        const percent = total > 0 ? Math.floor((current / total) * 100) : 0;
        const backupId = "backup-process";

        showPersistentNotification(backupId, {
          mainText: status,
          progressText: [
            `${current} of ${total} (${success_count} succeeded, ${failed_count} failed)`,
            `${current_file ? `Current: ${current_file}` : ""}`,
          ],
          progress: percent,
          isComplete: percent === 100,
        });

        if (percent === 100) {
          setTimeout(() => {
            const finalText =
              failed_count === 0
                ? `Backup completed successfully! ${success_count} files backed up.`
                : `Backup completed with issues. ${success_count} succeeded, ${failed_count} failed.`;

            showPersistentNotification(backupId, {
              mainText: finalText,
              progress: 100,
              isComplete: true,
            });
          }, 1000);
        }
      });
    }

    setupListeners();

    return () => {
      if (unlistenClip) unlistenClip();
      if (unlistenBackup) unlistenBackup();
    };
  }, [showPersistentNotification]);

  return <>{children}</>;
};

export default PersistentListener;
