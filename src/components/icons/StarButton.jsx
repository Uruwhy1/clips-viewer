import React from "react";
import { Star } from "lucide-react";
import styles from "./StarButton.module.css";

const StarButton = React.memo(({ active, ...restProps }) => {
  return (
    <Star
      {...restProps}
      className={` ${styles.favouriteButton} ${active ? styles.active : ""}`}
    />
  );
});

export default StarButton;
