import React from "react";
import { Star } from "lucide-react";
import styles from "./StarButton.module.css";
const MemoizedStar = React.memo(({ ...props }) => <Star {...props} />);

const StarButton = ({ active, ...restProps }) => {
  return (
    <MemoizedStar
      {...restProps}
      className={` ${styles.favouriteButton} ${active ? styles.active : ""}`}
    />
  );
};

export default StarButton;
