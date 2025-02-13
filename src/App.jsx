import { useEffect, useState, useRef, useContext } from "react";
import "./reset.css";
import "./App.css";
import CurrentVideo from "./components/CurrentVideo";
import Clips from "./components/Clips";
import TitleBar from "./components/TitleBar";
import Sidebar from "./components/Sidebar";
import Settings from "./components/Settings";
import GlobalContext from "./contexts/GlobalContext";

function App() {
  const [view, setView] = useState("clips");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef(null);
  const { coverCache, settings } = useContext(GlobalContext);

  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
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

    const handleClick = (event) => {
      const settingsIcon = document.querySelector('[data-role="settings"]');
      if (
        isSettingsOpen &&
        settingsRef.current &&
        !settingsRef.current.contains(event.target) &&
        !settingsIcon.contains(event.target)
      ) {
        setIsSettingsOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscapeKey);
    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("keydown", handleEscapeKey);
      window.removeEventListener("click", handleClick);
    };
  }, [view, isSettingsOpen]);

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
        setView={setView}
        openSettings={() => setIsSettingsOpen(!isSettingsOpen)}
      />
      {currentView()}
      <Settings ref={settingsRef} isOpen={isSettingsOpen} />
    </>
  );
}

export default App;
