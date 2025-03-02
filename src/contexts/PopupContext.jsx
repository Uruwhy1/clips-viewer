import PropTypes from "prop-types";
import { createContext, useState, useEffect, useContext } from "react";

import styles from "./PopupContext.module.css";
export const PopupContext = createContext();

export const PopupProvider = ({ children }) => {
  const [popupQueue, setPopupQueue] = useState([]);
  const [popupActive, setPopupActive] = useState(false);
  const [currentPopup, setCurrentPopup] = useState({
    text: "",
    type: "",
  });

  const showPopup = (text, isSuccess) => {
    setPopupQueue((prevQueue) => [
      ...prevQueue,
      { text, type: isSuccess ? "success" : "failure" },
    ]);
  };

  useEffect(() => {
    const processQueue = async () => {
      if (popupActive || popupQueue.length === 0) return;

      setPopupActive(true);
      setCurrentPopup(popupQueue[0]);

      await new Promise((resolve) => setTimeout(resolve, 3000));

      setPopupQueue((prevQueue) => prevQueue.slice(1));
      setPopupActive(false);
    };

    processQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popupQueue, popupActive]);

  return (
    <PopupContext.Provider value={{ showPopup }}>
      {popupActive && (
        <div
          id="popup"
          className={`${styles.popup} ${styles[currentPopup.type]} ${
            styles.active
          }`}
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
                {" "}
                <polyline points="9 11 12 14 22 4"></polyline>{" "}
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
                {" "}
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="2"
                  ry="2"
                ></rect>{" "}
                <line x1="9" y1="9" x2="15" y2="15"></line>{" "}
                <line x1="15" y1="9" x2="9" y2="15"></line>
              </svg>
            )}
          </div>
          <p className={styles.text}>{currentPopup.text}</p>
        </div>
      )}
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

PopupProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PopupContext;
