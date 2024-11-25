import { useContext } from "react";
import GlobalContext from "../contexts/GlobalContext";

const CurrentVideo = () => {
  const { currentClip } = useContext(GlobalContext);

  if (currentClip == null) {
    return <div>Loading...</div>;
  }
  console.log(currentClip);

  return (
    <>
      <video id="video" src={currentClip.path}></video>
      <div className="info">
        <div className="clip-title-container">
          <p id="clip-title">{currentClip.name}</p>
          <p
            id="clip-favourite"
            className={currentClip.isFavourite ? "active" : ""}
          >
            ★
          </p>
        </div>
        <p id="clip-game">{currentClip.game}</p>
        <p id="clip-date">{currentClip.date}</p>
        <p id="clip-filename">{currentClip.path}</p>
      </div>
    </>
  );
};

export default CurrentVideo;
