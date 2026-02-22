import { motion } from "motion/react";
import PageCover from "./PageCover";


const OverlayModal: React.FC<{ children: React.ReactNode, zIndex: string, onClick: () => void }> = ({ children, zIndex, onClick }) => (
  <motion.div
    style={{ position: "fixed", inset: 0, zIndex }}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <PageCover onClick={onClick} z={zIndex} />
    {children}
  </motion.div>
);


export default OverlayModal;
