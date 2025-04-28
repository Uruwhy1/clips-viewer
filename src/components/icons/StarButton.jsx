import React, { useState } from "react";
import { Star } from "lucide-react";
import styles from "./StarButton.module.css";

const StarButton = React.memo(({ active, ...restProps }) => {
  const [animate, setAnimate] = useState(false);

  const handleClick = (e) => {
    setAnimate(true);
  };

  const handleAnimationEnd = () => {
    setAnimate(false);
  };

  return (
    <Star
      {...restProps}
      onClick={handleClick}
      onAnimationEnd={handleAnimationEnd}
      className={`${styles.favouriteButton} ${active ? styles.active : ""} ${
        animate ? styles.animate : ""
      }`}
    />
  );
});

export default StarButton;
