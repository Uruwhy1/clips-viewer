import { convertFileSrc } from "@tauri-apps/api/core";
import { useContext } from "react";
import GlobalContext from "../contexts/GlobalContext";

const CurrentVideo = () => {
  const { currentClip, toggleFavourite } = useContext(GlobalContext);

  if (currentClip == null) {
    return <div>Loading...</div>;
  }

  const handleFavouriteClick = (path) => {
    toggleFavourite(path);
  };

  return (
    <>
      <video
        id="video"
        controls
        src={convertFileSrc(currentClip.filePath)}
      ></video>
      <div className="info">
        <div className="clip-title-container">
          <p id="clip-title">{currentClip.name}</p>
          <p
            id="clip-favourite"
            className={currentClip.isFavourite ? "active" : ""}
            onClick={() => handleFavouriteClick(currentClip.filePath)}
          >
            ★
          </p>
        </div>
        <p id="clip-game">{currentClip.game}</p>
        <p id="clip-date">{currentClip.formattedDate}</p>
        <p id="clip-filename">{currentClip.filePath}</p>
      </div>
    </>
  );
};

export default CurrentVideo;
