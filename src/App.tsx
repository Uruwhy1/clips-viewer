import { useEffect, useState, useRef, useContext } from "react";
import { AnimatePresence } from "motion/react"

import "./reset.css";
import "./root.css";
import "./App.css";
import CurrentVideo from "./components/CurrentVideo";
import Clips from "./components/Clips";
import TitleBar from "./components/TitleBar";
import Sidebar from "./components/Sidebar";
import Settings from "./components/Settings";
import NewClipsPopup from "./components/NewClips";

import { useSettings } from "./contexts/SettingsContext";
import { useClips } from "./contexts/ClipsContext";
import { useMedia } from "./contexts/MediaContext";

import { usePopup } from "./contexts/PopupContext.js";
import SplashScreen from "./SplashScreen";
import { Clip } from "./types/clip";
import PageCover from "./components/PageCover";
import OverlayModal from "./components/OverlayModal";

function App() {
  const [view, setView] = useState("clips");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [showNewClipsPopup, setShowNewClipsPopup] = useState(false);

  const settingsRef = useRef<HTMLDivElement | null>(null);

  const { coverCache } = useMedia();
  const { settings } = useSettings();
  const { allClips, setAllClips } = useClips();

  const firstLoadRef = useRef(true);
  const { showPopup } = usePopup();

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
        } else if (showNewClipsPopup) {
          setShowNewClipsPopup(false);
        } else {
          switch (view) {
            case "video":
              setView("clips");
              break;
            case "clips":
              if (document.body.scrollHeight > window.innerHeight) {
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
              } else {
                setIsSettingsOpen(true);
              }
              break;
            default:
              break;
          }
        }
      }
    };

    const handleClick = (event: MouseEvent) => {
      const settingsIcon = document.querySelector('[data-role="settings"]');
      if (
        isSettingsOpen &&
        settingsIcon &&
        settingsRef.current &&
        !(
          settingsRef.current.contains(event.target as Node) ||
          settingsIcon.contains(event.target as Node)
        )
      ) {
        setIsSettingsOpen(false);
      }
    };

    const handleNewClips = (event: CustomEvent<Clip[]>) => {
      setAllClips((current) => [...current, ...event.detail]);
      setShowNewClipsPopup(true);
    };


    window.addEventListener("keydown", handleEscapeKey);
    window.addEventListener("click", handleClick);

    window.addEventListener(
      "newClipsDetected",
      handleNewClips as EventListener,
    );

    return () => {
      window.removeEventListener("keydown", handleEscapeKey);
      window.removeEventListener("click", handleClick);
      window.removeEventListener(
        "newClipsDetected",
        handleNewClips as EventListener,
      );
    };
  }, [view, isSettingsOpen]);

  const handleCloseNewClipsPopup = () => {
    setShowNewClipsPopup(false);
  };

  const handleClearNewClips = () => {
    setShowNewClipsPopup(false);
  };

  const currentView = () => {
    switch (view) {
      case "clips":
        return <Clips setView={setView} />;
      case "video":
        return <CurrentVideo />;
      default:
        return null;
    }
  };

  return (
    <>
      <SplashScreen />
      {coverCache && (
        <div
          style={{
            position: "absolute",
            width: "0px",
            height: "0px",
            overflow: "hidden",
            pointerEvents: "none",
            top: 0,
            left: 0,
          }}
        >
          {Array.from(coverCache).map(([name, coverPath], index) => (
            <img
              key={index}
              src={coverPath}
              style={{
                width: 0,
                height: 0,
              }}
              alt=""
              loading="eager"
            />
          ))}
        </div>
      )}

      <TitleBar />
      <Sidebar
        view={view}
        setView={setView}
        settingsState={isSettingsOpen}
        newClipsState={showNewClipsPopup}
        newClipsNumber={allClips.filter((clip) => clip.newClip).length}
        setNewClipsState={setShowNewClipsPopup}
        openSettings={() => setIsSettingsOpen(!isSettingsOpen)}
      />
      {showNewClipsPopup && (
        <NewClipsPopup
          setView={setView}
          newClips={allClips.filter((clip) => clip.newClip)}
          onClose={handleCloseNewClipsPopup}
          onClear={handleClearNewClips}
        />
      )}
      {currentView()}

      <AnimatePresence mode="wait">
        {isSettingsOpen && (
          <>
            <OverlayModal
              onClick={() => setIsSettingsOpen(false)}
            >
              <Settings
                ref={settingsRef}
                onClose={() => setIsSettingsOpen(false)}
              />
            </OverlayModal>

          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default App;
