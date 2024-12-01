import { useContext } from "react";
import GlobalContext from "../contexts/GlobalContext";
import styles from "./ClipItem.module.css";

const ClipItem = ({ clip }) => {
  const { setCurrentClip, toggleFavourite } = useContext(GlobalContext);

  const handleClick = () => {
    setCurrentClip(clip);
  };

  const handleFavouriteClick = (path) => {
    toggleFavourite(path);
  };

  return (
    <div className={styles.clipCard}>
      <div className={styles.header}>
        <h3>{clip.name}</h3>
        <svg
          onClick={() => handleFavouriteClick(clip.filePath)}
          className={`${styles.favouriteButton} ${
            clip.isFavourite ? styles.active : ""
          }`}
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="inherit"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      </div>
      <div className={styles.clipMeta}>
        <div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
            <polyline points="17 2 12 7 7 2"></polyline>
          </svg>
          <span>{clip.game}</span>
        </div>
        <div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span> {clip.formattedDate}</span>
        </div>
      </div>
    </div>
  );
};

export default ClipItem;
