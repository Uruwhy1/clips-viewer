import React, { ReactNode, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { usePopup } from "./contexts/PopupContext";

interface PersistentListenerProps {
  children: ReactNode;
}

const PersistentListener: React.FC<PersistentListenerProps> = ({
  children,
}) => {
  const { showPersistentNotification } = usePopup();

  useEffect(() => {
    let unlistenClip: () => void;
    let unlistenBackup: () => void;
    let unlistenClipLoading: () => void;

    async function setupListeners() {
      // clip creation progress listener
      unlistenClip = await listen("clip-progress", (event) => {
        const { main_text, progress_text, progress, is_complete } =
          event.payload as {
            main_text: string;
            progress_text: string;
            progress: number;
            is_complete: boolean;
          };
        const popupId = "clip-process";

        showPersistentNotification(popupId, {
          mainText: main_text,
          progressText: [progress_text],
          progress,
          isComplete: is_complete,
        });
      });

      // clip loading progress listener
      unlistenClipLoading = await listen("clip-loading-progress", (event) => {
        const { main_text, progress_text, progress, is_complete } =
          event.payload as {
            main_text: string;
            progress_text: string;
            progress: number;
            is_complete: boolean;
          };
        const popupId = "clip-loading";

        showPersistentNotification(popupId, {
          mainText: main_text,
          progressText: [progress_text],
          progress,
          isComplete: is_complete,
        });
      });

      // backup progress listener
      unlistenBackup = await listen("backup-progress", (event) => {
        const {
          status,
          current,
          total,
          success_count,
          failed_count,
          current_file,
        } = event.payload as {
          status: string;
          current: number;
          total: number;
          success_count: number;
          failed_count: number;
          current_file: string | null;
        };

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
      if (unlistenClipLoading) unlistenClipLoading();
    };
  }, []);

  return <>{children}</>;
};

export default PersistentListener;
