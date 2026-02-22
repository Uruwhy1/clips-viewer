import { motion } from "motion/react";
import React from "react";

interface FadeInItemProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const FadeInItem: React.FC<FadeInItemProps> = ({ children, style }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={style}
    >
      {children}
    </motion.div>
  );
};

export default FadeInItem;
