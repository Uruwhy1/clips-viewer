import "./reset.css";
import "./App.css";
import { useEffect, useState } from "react";
import CurrentVideo from "./components/CurrentVideo";
import { checkOBSStatus, connectOBS } from "./helpers/OBS";
import Clips from "./components/Clips";
import TitleBar from "./components/TitleBar";
import Sidebar from "./components/Sidebar";
import Settings from "./components/Settings";

function App() {
  const [obs, setObs] = useState(null);
  const [view, setView] = useState("clips");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    (async () => {
      await connectOBS();
      setObs("Connected to OBS (" + (await checkOBSStatus()).version + ")");
    })();
  }, []);

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
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
              break;
            default:
              break;
          }
        }
      }
    };

    window.addEventListener("keydown", handleEscapeKey);

    return () => {
      window.removeEventListener("keydown", handleEscapeKey);
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
      <TitleBar />
      <Sidebar
        setView={setView}
        openSettings={() => setIsSettingsOpen(!isSettingsOpen)}
      />
      {currentView()}
      <Settings
        isOpen={isSettingsOpen}
        closeSettings={() => setIsSettingsOpen(false)}
      />
      <p
        style={{
          background: "#000",
          color: "#fff",
          position: "fixed",
          padding: "0.2rem",
          bottom: "0rem",
          right: "0rem",
          borderRadius: "0.2rem 0 0.2rem",
          zIndex: "99",
        }}
      >
        {obs}
      </p>
    </>
  );
}

export default App;
