import "./reset.css";
import "./App.css";
import { useContext, useEffect, useState } from "react";
import CurrentVideo from "./components/CurrentVideo";
import { checkOBSStatus, connectOBS } from "./helpers/OBS";
import Clips from "./components/Clips";
import GlobalContext from "./contexts/GlobalContext";

function App() {
  const [obs, setObs] = useState(null);
  const { currentClip, setCurrentClip } = useContext(GlobalContext);

  useEffect(() => {
    (async () => {
      await connectOBS();
      setObs("Connected to OBS (" + (await checkOBSStatus()).version + ")");
    })();
  }, []);

  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        setCurrentClip(null);
      }
    };

    window.addEventListener("keydown", handleEscapeKey);

    return () => {
      window.removeEventListener("keydown", handleEscapeKey);
    };
  }, []);

  return (
    <>
      {!currentClip ? <Clips /> : <CurrentVideo />}
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
