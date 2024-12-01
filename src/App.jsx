import "./reset.css";
import styles from "./App.module.css";
import { useContext, useEffect, useState } from "react";
import CurrentVideo from "./components/CurrentVideo";
import GamesList from "./components/GamesList";
import FavouriteClips from "./components/FavouriteClips";
import { checkOBSStatus, connectOBS } from "./helpers/OBS";
import Clips from "./components/Clips";
import GlobalContext from "./contexts/GlobalContext";

function App() {
  const [obs, setObs] = useState(null);
  const { currentClip } = useContext(GlobalContext);

  useEffect(() => {
    (async () => {
      await connectOBS();
      setObs("Connected to OBS (" + (await checkOBSStatus()).version + ")");
    })();
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
