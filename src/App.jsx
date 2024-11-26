import "./reset.css";
import "./App.css";
import "./Variables.css";
import { useState } from "react";
import CurrentVideo from "./components/CurrentVideo";
import GamesList from "./components/GamesList";
import RecentClips from "./components/RecentClips";
import FavouriteClips from "./components/FavouriteClips";

function App() {
  const [view, setView] = useState("games");

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
    </>
  );
}

export default App;
