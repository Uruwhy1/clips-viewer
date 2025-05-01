import React, { useState, MouseEvent } from "react";
import type { LucideProps } from "lucide-react";
import { Star } from "lucide-react";
import styles from "./StarButton.module.css";

type StarButtonProps = {
  active: boolean;
} & LucideProps;

const StarButton: React.FC<StarButtonProps> = React.memo(
  ({ active, ...restProps }) => {
    const [animate, setAnimate] = useState(false);

    const handleClick = (e: MouseEvent<SVGSVGElement>) => {
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
  }
);

export default StarButton;
