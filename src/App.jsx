import "./reset.css";
import "./App.css";
import { useContext, useEffect, useState } from "react";
import CurrentVideo from "./components/CurrentVideo";
import { checkOBSStatus, connectOBS } from "./helpers/OBS";
import Clips from "./components/Clips";
import TitleBar from "./components/TitleBar";
import Sidebar from "./components/Sidebar";
import GlobalContext from "./contexts/GlobalContext";

function App() {
  const [obs, setObs] = useState(null);
  const { currentClip, setCurrentClip } = useContext(GlobalContext);
  const [view, setView] = useState("clips");

  useEffect(() => {
    (async () => {
      await connectOBS();
      setObs("Connected to OBS (" + (await checkOBSStatus()).version + ")");
    })();
  }, []);

  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        setView("clips");
      }
    };

    window.addEventListener("keydown", handleEscapeKey);

    return () => {
      window.removeEventListener("keydown", handleEscapeKey);
    };
  }, []);

  const currentView = () => {
    switch (view) {
      case "clips":
        return <Clips setView={setView} />;
      case "video":
        return <CurrentVideo />;
      case "settings":
        return "xd";
    }
  };

  return (
    <>
      <TitleBar />
      <Sidebar setView={setView} />
      {currentView()}
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
