import "./reset.css";
import "./App.css";
import "./Variables.css";
import { useEffect, useState } from "react";
import CurrentVideo from "./components/CurrentVideo";
import GamesList from "./components/GamesList";
import RecentClips from "./components/RecentClips";
import FavouriteClips from "./components/FavouriteClips";
import { checkOBSStatus, connectOBS } from "./helpers/OBS";
function App() {
  const [view, setView] = useState("games");
  const [obs, setObs] = useState(null);

  const renderView = () => {
    switch (view) {
      case "games":
        return <GamesList />;
      case "recent":
        return <RecentClips />;
      case "favourites":
        return <FavouriteClips />;
      default:
        return <GamesList />;
    }
  };

  useEffect(() => {
    (async () => {
      await connectOBS();
      setObs("Connected to OBS (" + (await checkOBSStatus()).version + ")");
    })();
  }, []);

  return (
    <>
      <div className="left">
        <CurrentVideo />
      </div>
      <div className="right">
        <div id="view-switcher">
          <button
            className={view === "games" ? "active" : ""}
            onClick={() => setView("games")}
          >
            Games
          </button>
          <button
            className={view === "recent" ? "active" : ""}
            onClick={() => setView("recent")}
          >
            Recent
          </button>
          <button
            className={view === "favourites" ? "active" : ""}
            onClick={() => setView("favourites")}
          >
            Favourites
          </button>
        </div>
        <div className="view-content">{renderView()}</div>
      </div>
      <p style={{ position: "absolute", bottom: "0.5rem", right: "1rem" }}>
        {obs}
      </p>
    </>
  );
}

export default App;
