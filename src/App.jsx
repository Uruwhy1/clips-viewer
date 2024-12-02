import "./reset.css";
import styles from "./App.module.css";
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
      <p style={{ position: "fixed", bottom: "0.5rem", right: "1rem" }}>
        {obs}
      </p>
    </>
  );
}

export default App;
