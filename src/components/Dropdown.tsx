import { motion, AnimatePresence } from "motion/react";

interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Dropdown: React.FC<DropdownProps> = ({ isOpen, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          style={{
            overflow: "hidden",
            position: 'absolute',
            top: '110%',
            minWidth: '100%'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Dropdown;
