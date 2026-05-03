import React, { ReactNode, useEffect } from "react";

interface PersistentListenerProps {
  children: ReactNode;
}

const PersistentListener: React.FC<PersistentListenerProps> = ({
  children,
}) => {
  useEffect(() => {
    // Tauri event listeners removed for Electron
    // The app will use standard React state management instead
  }, []);

  return <>{children}</>;
};

export default PersistentListener;