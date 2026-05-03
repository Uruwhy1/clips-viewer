import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import styles from "./PopupContext.module.css";
import Button from "../components/Button";
import {
  PopupButton,
  PersistentNotificationInfo,
  PopupData,
} from "../types/popups";

interface PopupContextTypes {
  showPopup: (
    text: string,
    isSuccess: boolean,
    buttons?: PopupButton[],
  ) => void;
  showPersistentNotification: (
    id: string,
    info: PersistentNotificationInfo,
  ) => void;
  removePersistentNotification: (id: string) => void;
}

export const PopupContext = createContext<PopupContextTypes | undefined>(
  undefined,
);

interface PopupProviderProps {
  children: ReactNode;
}

export const PopupProvider = ({ children }: PopupProviderProps) => {
  const [popupQueue, setPopupQueue] = useState<PopupData[]>([]);
  const [popupActive, setPopupActive] = useState(false);
  const [currentPopup, setCurrentPopup] = useState<PopupData | null>(null);

  const [persistentNotifications, setPersistentNotifications] = useState<
    Record<string, PersistentNotificationInfo & { timestamp: number }>
  >({});

  const showPopup = (
    text: string,
    isSuccess: boolean,
    buttons?: PopupButton[],
  ) => {
    setPopupQueue((prevQueue) => [
      ...prevQueue,
      { text, type: isSuccess ? "success" : "failure", buttons },
    ]);
  };

  const showPersistentNotification = (
    id: string,
    info: PersistentNotificationInfo,
  ) => {
    setPersistentNotifications((prev) => ({
      ...prev,
      [id]: {
        ...info,
        timestamp: Date.now(),
      },
    }));
  };

  const removePersistentNotification = (id: string) => {
    setPersistentNotifications((prev) => {
      const newNotifications = { ...prev };
      delete newNotifications[id];
      return newNotifications;
    });
  };

  useEffect(() => {
    const processQueue = async () => {
      if (popupActive || popupQueue.length === 0) return;

      setPopupActive(true);
      setCurrentPopup(popupQueue[0]);

      await new Promise((resolve) => setTimeout(resolve, 5000));

      setPopupQueue((prevQueue) => prevQueue.slice(1));
      setPopupActive(false);
      setCurrentPopup(null);
    };

    processQueue();
  }, [popupQueue, popupActive]);

  useEffect(() => {
    const completedIds = Object.entries(persistentNotifications)
      .filter(([_, notification]) => notification.isComplete)
      .map(([id, _]) => id);

    if (completedIds.length > 0) {
      const timers = completedIds.map((id) => {
        return setTimeout(() => {
          removePersistentNotification(id);
        }, 5000);
      });

      return () => {
        timers.forEach((timer) => clearTimeout(timer));
      };
    }
  }, [persistentNotifications]);

  return (
    <PopupContext.Provider
      value={{
        showPopup,
        showPersistentNotification,
        removePersistentNotification,
      }}
    >
      <div className={styles.notificationsContainer}>
        {popupActive && currentPopup && (
          <div
            id="popup"
            className={`${styles.popup} ${styles[currentPopup.type]} ${styles.active}`}
          >
            <div className={styles.icon}>
              {currentPopup.type === "success" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                </svg>
              )}
            </div>
            <p className={styles.text}>{currentPopup.text}</p>
            {currentPopup.buttons && (
              <div className={styles.buttons}>
                {currentPopup.buttons.map((button, index) => (
                  <Button
                    key={index}
                    onClick={button.func}
                    protect={button.protect}
                  >
                    {button.text}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {Object.entries(persistentNotifications).map(([id, notification]) => (
          <div
            key={id}
            className={`${styles.persistentNotification} ${notification.isComplete ? styles.completed : ""
              }`}
          >
            <div className={styles.persistentHeader}>
              <div className={styles.icon}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <h4>{notification.mainText}</h4>
            </div>

            {notification.progressText && (
              <div className={styles.progressTextContainer}>
                {notification.progressText.map((text, index) => (
                  <p key={index} className={styles.text}>
                    {text}
                  </p>
                ))}
              </div>
            )}
            {notification.progress !== null && (
              <div className={styles.progressBarContainer}>
                <div
                  className={styles.progressBar}
                  style={{ width: `${notification.progress}%` }}
                ></div>
              </div>
            )}
            {notification.buttons && (
              <div className={styles.buttons}>
                {notification.buttons.map((button, index) => (
                  <Button
                    key={index}
                    onClick={button.func}
                    protect={button.protect}
                  >
                    {button.text}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {children}
    </PopupContext.Provider>
  );
};

export const usePopup = () => {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error("usePopup must be used within an PopupProvider");
  }
  return context;
};

export default PopupContext;
