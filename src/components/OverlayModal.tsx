import { motion } from "motion/react";
import PageCover from "./PageCover";


const OverlayModal: React.FC<{ children: React.ReactNode, onClick: () => void }> = ({ children, onClick }) => (
  <motion.div
    style={{ position: "fixed", inset: 0, zIndex: 'var(--settingsZ)' }}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <PageCover onClick={onClick} />
    {children}
  </motion.div>
);


export default OverlayModal;
